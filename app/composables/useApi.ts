import { useAuthStore } from '~/stores/auth';
import { createSessionFetch } from '~/utils/session-fetch';
export const useApi = () => {
  const auth = useAuthStore();
  const requestFetch = useRequestFetch();
  const router = useRouter();
  return createSessionFetch(requestFetch, auth, ({ response }) => {
    if (response?.status === 401) {
      auth.clearPersistedAuth();
      if (import.meta.client) void router.push('/login');
    }
    if (response?.status === 403 && import.meta.client && router.currentRoute.value.path !== '/403') {
      void router.push('/403');
    }
  });
};
