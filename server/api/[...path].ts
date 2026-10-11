import { defineEventHandler, getRequestURL, getHeader, createError, proxyRequest } from 'h3';
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const upstream = new URL(config.apiUpstream);
  if (upstream.pathname !== '/' || upstream.search || upstream.hash || upstream.username || upstream.password || !['http:', 'https:'].includes(upstream.protocol)) throw createError({ statusCode: 503, statusMessage: 'Upstream inválido' });
  const url = getRequestURL(event);
  const rawPath = event.path.split('?')[0];
  // Fixed API origin, fixed prefix. No arbitrary URL, docs or public upload passthrough.
  // Context identifiers include dots (e.g. dashboard.operational); dots are
  // permitted inside identifiers, but never as traversal path segments.
  if (!/^\/api\/v1\/[a-zA-Z0-9/_.-]+$/.test(rawPath)
    || rawPath.split('/').some((segment) => segment === '.' || segment === '..')
    || rawPath !== url.pathname) {
    throw createError({ statusCode: 404 });
  }
  const authorization = getHeader(event, 'authorization');
  if (authorization) throw createError({ statusCode: 400, statusMessage: 'Use a sessão do navegador' });
  return proxyRequest(event, `${upstream.origin}${url.pathname}${url.search}`, { headers: { authorization: '', host: upstream.host }, fetchOptions: { redirect: 'manual' } });
});
