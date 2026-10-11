import { randomBytes } from 'node:crypto';
import { defineEventHandler, setResponseHeader, removeResponseHeader } from 'h3';
export default defineEventHandler((event) => {
  const nonce = randomBytes(24).toString('base64');
  event.context.cspNonce = nonce;
  removeResponseHeader(event, 'X-Powered-By');
  setResponseHeader(event, 'Cache-Control', 'no-store');
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff');
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setResponseHeader(event, 'X-Frame-Options', 'DENY');
  // Script nonces apply to generated SSR scripts. Styles remain inline for Naive UI's runtime CSS.
  const script = process.env.NODE_ENV === 'production' ? `'self' 'nonce-${nonce}'` : "'self' 'unsafe-inline' 'unsafe-eval'";
  const connections = process.env.NODE_ENV === 'production' ? "'self'" : "'self' ws: http://localhost:* http://127.0.0.1:*";
  setResponseHeader(event, 'Content-Security-Policy', `default-src 'self'; script-src ${script}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src ${connections}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`);
  if (process.env.NODE_ENV === 'production') setResponseHeader(event, 'Strict-Transport-Security', `max-age=${Number(process.env.HSTS_MAX_AGE || 300)}`);
});
