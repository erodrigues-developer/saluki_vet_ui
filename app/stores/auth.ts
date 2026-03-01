import { defineStore } from 'pinia';

interface User {
  id: number;
  name: string;
  email: string;
  roles: any[];
}

interface AuthState {
  token: string | null;
  user: User | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => {
      if (!state.user || !state.user.roles) return false;
      return state.user.roles.some((r) => r.code === 'ADMIN');
    }
  },
  actions: {
    cookieOptions() {
      return {
        sameSite: 'lax' as const,
        path: '/',
      };
    },
    setUserFromStorage(userStr: string | null) {
      if (!userStr) {
        this.user = null;
        return;
      }

      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        this.user = null;
        if (process.client) {
          localStorage.removeItem('auth_user');
        }
      }
    },
    clearPersistedAuth() {
      const tokenCookie = useCookie<string | null>('auth_token', this.cookieOptions());
      // Remove cookie legado que armazenava usuário completo.
      const legacyUserCookie = useCookie<string | null>('auth_user', this.cookieOptions());
      tokenCookie.value = null;
      legacyUserCookie.value = null;

      if (process.client) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    },
    setAuth(token: string, user: User) {
      this.token = token;
      this.user = user;

      // Cookie do token é a fonte de verdade para SSR.
      const tokenCookie = useCookie<string | null>('auth_token', this.cookieOptions());
      tokenCookie.value = token;

      // Remove cookie legado para não depender de payload grande em cookie.
      const legacyUserCookie = useCookie<string | null>('auth_user', this.cookieOptions());
      legacyUserCookie.value = null;

      if (process.client) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      this.clearPersistedAuth();
      if (process.client) navigateTo('/login');
    },
    initAuth() {
      const tokenCookie = useCookie<string | null>('auth_token', this.cookieOptions());

      // Fluxo principal: token vem de cookie, compatível com SSR/CSR.
      if (tokenCookie.value) {
        this.token = tokenCookie.value;
        if (process.client) {
          this.setUserFromStorage(localStorage.getItem('auth_user'));
        }
        return;
      }

      this.token = null;
      this.user = null;

      // Migração legada: se só existir localStorage, sobe token para cookie.
      if (process.client) {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');

        if (token) {
          this.token = token;
          tokenCookie.value = token;
          this.setUserFromStorage(userStr);
        }
      }
    }
  },
});
