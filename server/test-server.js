const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.method, req.url);
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({status: 'OK', message: 'Simple test server working'}));
});

server.listen(3002, () => {
  console.log('Simple test server running on port 3002');
  console.log('Test with: curl http://localhost:3002');
});
