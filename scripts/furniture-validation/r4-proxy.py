"""Ephemeral QA origin: isolates browser storage from the user's localhost designs."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
class Proxy(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            response=urlopen(Request('http://127.0.0.1:3003'+self.path, headers={'Accept':self.headers.get('Accept','*/*')}),timeout=90)
        except HTTPError as error:
            response=error
        self.send_response(response.status)
        for k,v in response.headers.items():
            if k.lower() not in ['transfer-encoding','connection','content-length','content-encoding']: self.send_header(k,v)
        data=response.read();self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),Proxy)
print(server.server_port,flush=True)
server.serve_forever()
