"""Local dev server with caching disabled, so every reload shows the latest files and art.
Usage: python tools/serve.py [port]"""
import http.server, os, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
print(f'Space Syntax on http://127.0.0.1:{port}', flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()
