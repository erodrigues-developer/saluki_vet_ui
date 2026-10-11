import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createApp, toNodeListener } from 'h3';
import handler from '../../server/api/[...path].ts';

test('fixed-origin proxy forwards dotted AI contexts and preserves security restrictions', async () => {
  const requests = [];
  const upstream = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ path: req.url, method: req.method, body, headers: req.headers });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ forwarded: true }));
  });
  const proxy = http.createServer(toNodeListener(createApp().use(handler)));
  const listen = async (server) => { server.listen(0, '127.0.0.1'); await once(server, 'listening'); return `http://127.0.0.1:${server.address().port}`; };
  try {
    const apiOrigin = await listen(upstream);
    globalThis.useRuntimeConfig = () => ({ apiUpstream: apiOrigin });
    const origin = await listen(proxy);
    const payload = JSON.stringify({ title: 'Assistente inteligente', metadata: { screen: 'dashboard' } });
    const response = await fetch(`${origin}/api/v1/ai/conversations/context/dashboard.operational/current?limit=1`, {
      method: 'POST', body: payload, headers: {
        'Content-Type': 'application/json', Cookie: 'sigmavet_session=fictitious',
        Origin: origin, 'X-CSRF-Token': 'fictitious-csrf', 'X-Sigmavet-Request': '1',
      },
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { forwarded: true });
    assert.equal(requests[0].path, '/api/v1/ai/conversations/context/dashboard.operational/current?limit=1');
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].body, payload);
    assert.equal(requests[0].headers.cookie, 'sigmavet_session=fictitious');
    assert.equal(requests[0].headers['x-csrf-token'], 'fictitious-csrf');
    assert.equal(requests[0].headers['x-sigmavet-request'], '1');
    assert.equal(requests[0].headers.origin, origin);
    for (const path of ['/api/v1/../auth', '/api/v1/./auth', '/api/v1/%2e%2e/private', '/api/v1/files/%2Fetc', '/api/v1/ai/back\\slash', '/api/docs', '/uploads/private']) {
      // Raw paths avoid fetch's URL normalization hiding invalid input.
      const status = await new Promise((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port: proxy.address().port, path }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
      });
      assert.equal(status, 404, path);
    }
    assert.equal((await fetch(`${origin}/api/v1/auth/me`, { headers: { Authorization: 'Bearer fictitious' } })).status, 400);
    globalThis.useRuntimeConfig = () => ({ apiUpstream: `${apiOrigin}/unexpected` });
    assert.equal((await fetch(`${origin}/api/v1/auth/me`)).status, 503);
    assert.equal(requests.length, 1, 'rejected requests never reach upstream');
  } finally {
    delete globalThis.useRuntimeConfig;
    await Promise.all([new Promise((r) => proxy.close(r)), new Promise((r) => upstream.close(r))]);
  }
});
