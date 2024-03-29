import asyncio
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler
from tornado.escape import json_decode
import logging

ALLOWED_WS_ORIGINS = [
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'https://footy-charts.onrender.com',
    'https://footycharts.com.au',
]

ALLOWED_HTTP_HOST_NAMES = [
    'localhost',
]

ALLOWED_HTTP_REMOTE_IPS = [
    '127.0.0.1',
    '::1',
    '13.228.225.19',
    '18.142.128.26',
    '54.254.162.138',
]

logger = logging.getLogger(__name__)

CLIENTS = set()
class SocketHandler(WebSocketHandler):
    @classmethod
    def send_message(cls, message: str):
        logger.info(f'Sending message to clients {CLIENTS}')
        for client in CLIENTS:
            client.write_message(message)
    
    def initialize(self):
        pass
    
    def open(self):
        logger.info(f'Opening connection with client {self}')
        CLIENTS.add(self)
        self.write_message('Connected')
    
    def on_message(self, message):
        logger.info(f'Message received from client {self}: {message}')
    
    def on_close(self):
        logger.info(f'Closing connection with client {self}')
        CLIENTS.remove(self)
    
    def check_origin(self, origin):
        return origin in ALLOWED_WS_ORIGINS
    
class HttpHandler(RequestHandler):
    def get(self):
        logger.info(f'GET request received from IP {self.request.remote_ip},'
            f' hostname {self.request.host_name}')
        self.write('200 OK')
        
    def post(self):
        logger.info(f'POST request received from IP {self.request.remote_ip},'
            f' hostname {self.request.host_name}')
        if self.request.host_name not in ALLOWED_HTTP_HOST_NAMES and \
                self.request.remote_ip not in ALLOWED_HTTP_REMOTE_IPS:
            self.write('403 Forbidden')
            return
        message = json_decode(self.request.body)
        SocketHandler.send_message(message)
        self.write('200 OK')

async def main():
    logging.basicConfig(level=logging.INFO)
    logger.info('Server starting')
    app = Application([
        (r'/', HttpHandler),
        (r'/ws', SocketHandler),
    ])
    app.listen(7000)
    await asyncio.Event().wait()

if __name__ == '__main__':
    asyncio.run(main())