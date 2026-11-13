// Zero-dependency static server for Hariyo (app.gujaratbio.com): gzip, caching, app shell fallback.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = __dirname, PORT = process.env.PORT || 3000, GZ = new Map();
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const BLOCK = /^\/(\.|server\.js|package(-lock)?\.json|README\.md|node_modules)/;
function send(req, res, file) {
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404, {'Content-Type': 'text/plain'}); return res.end('Not found'); }
    const ext = path.extname(file), name = path.basename(file);
    const h = {'Content-Type': MIME[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Accept-Encoding'};
    h['Cache-Control'] = (ext === '.html' || name === 'sw.js' || ext === '.webmanifest' || name === 'crops.json') ? 'no-cache'
      : (ext === '.css' || ext === '.js') ? 'public, max-age=86400' : 'public, max-age=2592000';
    if (name === 'admin.html') h['X-Robots-Tag'] = 'noindex';
    if (/^\.(html|css|js|json|webmanifest|svg|txt)$/.test(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      let z = GZ.get(file); if (!z || z.len !== buf.length) { z = {len: buf.length, data: zlib.gzipSync(buf)}; GZ.set(file, z); }
      h['Content-Encoding'] = 'gzip'; res.writeHead(200, h); return res.end(z.data);
    }
    res.writeHead(200, h); res.end(buf);
  });
}
http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (BLOCK.test(p) || p.includes('..')) { res.writeHead(404); return res.end('Not found'); }
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, p);
  fs.stat(file, (e, st) => {
    if (!e && st.isFile()) return send(req, res, file);
    if (!e && st.isDirectory()) return send(req, res, path.join(file, 'index.html'));
    if (!path.extname(p)) return send(req, res, path.join(ROOT, 'index.html'));  // app shell for unknown paths
    res.writeHead(404, {'Content-Type': 'text/plain'}); res.end('Not found');
  });
}).listen(PORT, () => console.log('Hariyo on port ' + PORT));
