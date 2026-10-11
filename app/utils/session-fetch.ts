import type { FetchContext, FetchOptions } from 'ofetch';

type RequestFetch = <T>(request: string, options?: FetchOptions) => Promise<T>;
type Session = { csrfToken: string | null };

// Nuxt's SSR request fetch is callable but does not necessarily expose .create().
export const createSessionFetch = (
  requestFetch: RequestFetch,
  session: Session,
  onResponseError: (context: FetchContext) => void,
) => <T = unknown>(request: string, options: FetchOptions = {}) => requestFetch<T>(request, {
  ...options,
  credentials: 'same-origin',
  async onRequest(context) {
    const hooks = options.onRequest ? [options.onRequest].flat() : [];
    for (const hook of hooks) await hook(context);
    const headers = new Headers(context.options.headers);
    headers.delete('Authorization');
    headers.set('X-Sigmavet-Request', '1');
    if (session.csrfToken) headers.set('X-CSRF-Token', session.csrfToken);
    else headers.delete('X-CSRF-Token');
    context.options.headers = headers;
  },
  async onResponseError(context) {
    onResponseError(context);
    const hooks = options.onResponseError ? [options.onResponseError].flat() : [];
    for (const hook of hooks) await hook(context);
  },
});
