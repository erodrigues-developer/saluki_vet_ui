import { createServer } from 'node:http'

// Only the anonymous session response needed by SSR/hydration is simulated.
// Login errors are intercepted in the browser by the rendering test itself.
const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  const anonymousSession = request.method === 'GET'
    && request.url === '/api/v1/auth/me'
  response.writeHead(anonymousSession ? 401 : 404)
  response.end(JSON.stringify({
    message: anonymousSession ? 'Não autenticado' : 'Rota não simulada',
  }))
})

server.listen(3100, '127.0.0.1', () => {
  console.log('Rendering API fixture listening on http://127.0.0.1:3100')
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close())
}
