import asyncio
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler
from tornado.escape import json_decode

ALLOWED_ORIGINS = [
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'https://footy-charts.onrender.com',
    'https://footycharts.com.au',
]

CLIENTS = set()
class SocketHandler(WebSocketHandler):
    @classmethod
    def send_message(cls, message: str):
        print(f'Sending message to clients {CLIENTS} ')
        for client in CLIENTS:
            client.write_message(message)
    
    def initialize(self):
        pass
    
    def open(self):
        CLIENTS.add(self)
        self.write_message('connected')
        print('open')
    
    def on_message(self, message):
        print('message received:', message)
    
    def on_close(self):
        print('on_close')
        CLIENTS.remove(self)
    
    def check_origin(self, origin):
        return origin in ALLOWED_ORIGINS
    
class HttpHandler(RequestHandler):
    def get(self):
        self.write('200 OK')
        
    def post(self):
        message = json_decode(self.request.body)
        SocketHandler.send_message(message)

async def main():
    app = Application([
        (r'/', HttpHandler),
        (r'/ws', SocketHandler),
    ])
    app.listen(7000)
    await asyncio.Event().wait()

if __name__ == '__main__':
    asyncio.run(main())