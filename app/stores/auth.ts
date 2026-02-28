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
    setAuth(token: string, user: User) {
      this.token = token;
      this.user = user;

      // Armazena no localStorage para persistência client-side
      if (process.client) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    },
    logout() {
      this.token = null;
      this.user = null;

      if (process.client) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        navigateTo('/login');
      }
    },
    initAuth() {
      // Recupera o estado do localStorage na inicialização client-side
      if (process.client) {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');

        if (token && userStr) {
          this.token = token;
          try {
            this.user = JSON.parse(userStr);
          } catch (e) {
            this.logout();
          }
        }
      }
    }
  },
});
