"""Receive public configurator responses from the source browser on localhost.

Only manifest product IDs are accepted. No account, cookies or user data is read.
Run with python3 scripts/catalog-entry/source-designs/collect.py.
"""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / 'docs/handoffs/thumbnail-configurators/raw'
OUTPUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT / 'src/lib/catalog-images/manifest.json').read_text())
keys = {item['productKey'] for item in manifest if item['productKey'].endswith((',w', ',s'))}
for product in json.loads((ROOT / 'src/lib/sofa-catalog/catalog.json').read_text()):
    keys.update(f'{variant["id"]},s' for variant in product['variants'])
for key in json.loads((ROOT / 'src/lib/catalog-entry/starts.json').read_text()):
    if key.endswith((',w', ',s')):
        keys.add(key)
targets = [{'key': key, 'url': f'/api/v1/{"watty" if key.endswith(",w") else "sotty"}_configurator/{key.split(",")[0]}/'} for key in sorted(keys)]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', 'https://tylko.com')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.reply({})

    def do_GET(self):
        if self.path == '/targets':
            self.reply([t for t in targets if not (OUTPUT / f'{t["key"]}.json').exists()])
        else:
            self.reply({'saved': len(list(OUTPUT.glob('*.json'))), 'total': len(targets)})

    def do_POST(self):
        if self.path != '/responses':
            return self.reply({'error': 'unknown route'}, 404)
        length = int(self.headers.get('Content-Length', 0))
        if not 0 < length < 32_000_000:
            return self.reply({'error': 'invalid length'}, 400)
        records = json.loads(self.rfile.read(length))
        saved = 0
        for item in records:
            key = item['key']
            data = item.get('data')
            if key not in keys or item.get('status') != 200 or not isinstance(data, dict) or str(data.get('id')) != key.split(',')[0]:
                continue
            (OUTPUT / f'{key}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
            saved += 1
        self.reply({'saved': saved})
        print(f'Received {saved} exact public product responses', flush=True)


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
print(json.dumps({'port': server.server_port, 'targets': len(targets)}), flush=True)
server.serve_forever()
