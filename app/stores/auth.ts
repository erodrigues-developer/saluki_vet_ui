import { defineStore } from 'pinia';
interface User { id: number; name: string; email: string; roles: any[]; permissions?: string[] }
const pending = new WeakMap<object, Promise<User | null>>();
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as User | null, csrfToken: null as string | null, initialized: false }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => (state.user?.roles || []).some((r) => r.code === 'ADMIN'),
    permissionSet: (state) => new Set(state.user?.permissions || []),
    hasPermission: (state) => (p: string) => !p || (state.user?.roles || []).some((r) => r.code === 'ADMIN') || (state.user?.permissions || []).includes(p),
    hasAnyPermission: (state) => (ps: string[]) => !ps.length || (state.user?.roles || []).some((r) => r.code === 'ADMIN') || ps.some((p) => (state.user?.permissions || []).includes(p)),
    hasAllPermissions: (state) => (ps: string[]) => (state.user?.roles || []).some((r) => r.code === 'ADMIN') || ps.every((p) => (state.user?.permissions || []).includes(p)),
  },
  actions: {
    removeLegacyStorage() {
      if (import.meta.client) for (const name of ['auth_token', 'auth_user']) {
        localStorage.removeItem(name); sessionStorage.removeItem(name);
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      }
    },
    setAuth(user: User, csrfToken: string) { this.removeLegacyStorage(); this.user = user; this.csrfToken = csrfToken; this.initialized = true; },
    setUser(user: User) { this.user = user; },
    clearPersistedAuth() {
      this.user = null; this.csrfToken = null; this.initialized = true;
      this.removeLegacyStorage();
    },
    async refreshUser() {
      const existing = pending.get(this); if (existing) return existing;
      const requestFetch = useRequestFetch();
      const request = (async () => {
        try {
          const response = await requestFetch<{ data: { user: User; csrfToken: string } }>('/api/v1/auth/me', { credentials: 'same-origin' });
          this.setAuth(response.data.user, response.data.csrfToken); return this.user;
        } catch (error: any) {
          if (error?.statusCode === 401 || error?.response?.status === 401) { this.clearPersistedAuth(); return null; }
          throw error;
        }
      })();
      pending.set(this, request);
      try { return await request; } finally { pending.delete(this); }
    },
    async initAuth() { this.removeLegacyStorage(); if (!this.initialized) await this.refreshUser(); },
    async renew() {
      const response = await $fetch<{data: {user: User; csrfToken: string}}>('/api/v1/auth/renew', {
        method: 'POST', headers: { 'X-Sigmavet-Request': '1', 'X-CSRF-Token': this.csrfToken || '' },
      });
      this.setAuth(response.data.user, response.data.csrfToken);
    },
    async logout() {
      // Keep UI session intact if revocation fails; do not pretend logout succeeded.
      if (this.user) await $fetch('/api/v1/auth/logout', { method: 'POST', headers: { 'X-Sigmavet-Request': '1', 'X-CSRF-Token': this.csrfToken || '' } });
      this.clearPersistedAuth();
      if (import.meta.client) await navigateTo('/login');
    },
  },
});
