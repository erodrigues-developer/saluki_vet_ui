import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionFetch } from '../../app/utils/session-fetch.ts';

test('SSR callable without .create preserves request context and session security', async () => {
  const calls = [];
  // Same contract as Nuxt event.$fetch: a callable bound to its SSR request.
  const requestFetch = async (request, options) => {
    const context = { request, options: { ...options, headers: new Headers(options.headers) } };
    await options.onRequest(context);
    calls.push(context);
    return { id: 112 };
  };
  assert.equal(requestFetch.create, undefined);
  const session = { csrfToken: 'first-fictitious-csrf' };
  const api = createSessionFetch(requestFetch, session, () => {});
  const query = { consultationId: 112 };
  const body = { title: 'Fictitious prescription' };
  assert.deepEqual(await api('/api/v1/consultations/112', {
    query, method: 'POST', body, headers: { Authorization: 'Bearer legacy', 'X-Test': 'retained' },
    onRequest: ({ options }) => options.headers.set('X-Caller', 'retained'),
  }), { id: 112 });
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.headers.has('Authorization'), false);
  assert.equal(calls[0].options.headers.get('X-Sigmavet-Request'), '1');
  assert.equal(calls[0].options.headers.get('X-CSRF-Token'), session.csrfToken);
  assert.equal(calls[0].options.headers.get('X-Caller'), 'retained');
  assert.equal(calls[0].options.headers.get('X-Test'), 'retained');
  assert.equal(calls[0].options.query, query);
  assert.equal(calls[0].options.body, body);
  session.csrfToken = 'rotated-fictitious-csrf';
  await api('/api/v1/auth/renew');
  assert.equal(calls[1].options.headers.get('X-CSRF-Token'), session.csrfToken);
  session.csrfToken = null;
  await api('/api/v1/auth/me', { headers: { 'X-CSRF-Token': 'stale' } });
  assert.equal(calls[2].options.headers.has('X-CSRF-Token'), false);
});

test('response error handler works asynchronously without a Nuxt setup context', async () => {
  const seen = [];
  const api = createSessionFetch(async (request, options) => {
    await Promise.resolve();
    await options.onResponseError({ request, options, response: { status: 403 } });
    throw new Error('Forbidden');
  }, { csrfToken: null }, ({ response }) => seen.push(response.status));
  await assert.rejects(api('/api/v1/prescriptions', { onResponseError: () => seen.push('caller') }), /Forbidden/);
  assert.deepEqual(seen, [403, 'caller']);
});
