const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

http.createServer((req, res) => {
  // API: GET /api/settings — return global settings
  if (req.method === 'GET' && req.url === '/api/settings') {
    const data = readJSON(SETTINGS_FILE) || {};
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
    return;
  }

  // API: POST /api/settings — save global settings
  if (req.method === 'POST' && req.url === '/api/settings') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const existing = readJSON(SETTINGS_FILE) || {};
        Object.assign(existing, data);
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(existing, null, 2), 'utf8');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Static file serving
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  - Main page: http://localhost:${PORT}/index.html`);
  console.log(`  - Dashboard: http://localhost:${PORT}/dashboard.html`);
});
