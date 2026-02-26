import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  // Assegura que recuperou do localStorage se for um reload client-side
  if (process.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login'];

  if (publicRoutes.includes(to.path)) {
    // Se o usuário já está logado e tenta acessar o login, redireciona
    if (authStore.isAuthenticated) {
      return navigateTo('/');
    }
    return;
  }

  // Protege todas as outras rotas garantindo que existe um token
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});
