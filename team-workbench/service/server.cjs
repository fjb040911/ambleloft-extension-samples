// Demo business service, not a host subscription API. Loopback only; no credentials.
const http = require('node:http');
function createService() {
  const clients = new Set();
  let totalConnections = 0;
  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
      res.write(': ready\n\n');
      clients.add(res);
      totalConnections++;
      req.on('close', () => clients.delete(res));
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET' && req.url === '/stats') {
      res.end(JSON.stringify({ connections: clients.size, totalConnections }));
      return;
    }
    if (req.method === 'POST' && req.url === '/disconnect') {
      for (const c of clients) c.end();
      res.end('{}');
      return;
    }
    if (req.method === 'POST' && req.url === '/event') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 65536) {
          res.writeHead(413);
          res.end('{}');
          return;
        }
      }
      try {
        const event = JSON.parse(raw);
        for (const c of clients) c.write('data: ' + JSON.stringify(event) + '\n\n');
        res.end(JSON.stringify({ subscribers: clients.size }));
      } catch {
        res.writeHead(400);
        res.end('{}');
      }
      return;
    }
    res.writeHead(404);
    res.end('{}');
  });
  const heartbeat = setInterval(() => {
    for (const c of clients) c.write(': heartbeat\n\n');
  }, 5000);
  heartbeat.unref();
  server.on('close', () => clearInterval(heartbeat));
  return {
    server,
    close: async () => {
      for (const c of clients) c.end();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
module.exports = { createService };
if (require.main === module) {
  const service = createService();
  service.server.listen(Number(process.env.PORT || 47831), '127.0.0.1', () =>
    console.log(
      'Demo business events: http://127.0.0.1:' + service.server.address().port + '/events',
    ),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => service.close().then(() => process.exit(0)));
}
