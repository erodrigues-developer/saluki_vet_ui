import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  const publicRoutes = ['/login'];
  const normalizeRedirect = (value: unknown) => {
    const path = Array.isArray(value) ? value[0] : value;
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//') || path === '/login') return '/';
    return path;
  };

  // Assegura que recuperou sessão persistida antes de validar a rota.
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (publicRoutes.includes(to.path)) {
    // Se o usuário já está logado e tenta acessar o login, redireciona
    if (authStore.isAuthenticated) {
      return navigateTo(normalizeRedirect(to.query.redirect));
    }
    return;
  }

  // Protege todas as outras rotas garantindo que existe um token
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }
});
