import { useAuthStore } from '~/stores/auth';
import { findRoutePermissions, PERMISSIONS } from '~/constants/permissions';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const publicRoutes = ['/login'];
  const unrestrictedRoutes = ['/403'];

  // Assegura que recuperou sessão persistida antes de validar a rota.
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (publicRoutes.includes(to.path)) {
    // Se o usuário já está logado e tenta acessar o login, redireciona
    if (authStore.isAuthenticated) {
      return navigateTo('/');
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

  if (unrestrictedRoutes.includes(to.path)) {
    return;
  }

  let routePermissions = findRoutePermissions(to.path);
  if (to.path === '/consultas/novo-atendimento') {
    const consultationId = Array.isArray(to.query.id) ? to.query.id[0] : to.query.id;
    routePermissions = consultationId
      ? [PERMISSIONS.consultationsView]
      : [PERMISSIONS.consultationsCreate];
  }

  if (routePermissions.length > 0 && !authStore.user) {
    try {
      await authStore.refreshUser();
    } catch {
      authStore.clearPersistedAuth();
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      });
    }
  }

  if (
    routePermissions.length > 0 &&
    !authStore.hasAnyPermission(routePermissions)
  ) {
    return navigateTo('/403');
  }
});
