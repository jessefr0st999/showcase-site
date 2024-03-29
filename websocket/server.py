import asyncio
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler
from tornado.escape import json_decode
from dotenv import load_dotenv
import os
import logging

load_dotenv()

ALLOWED_WS_ORIGINS = [
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'https://footy-charts.onrender.com',
    'https://footycharts.com.au',
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
            f' host {self.request.host}')
        self.write('200 OK')
        
    def post(self):
        logger.info(f'POST request received from IP {self.request.remote_ip},'
            f' host {self.request.host}')
        auth_header = self.request.headers.get('Authorization')
        if auth_header != f'Bearer {os.getenv("WEBSOCKET_SECRET")}':
            self.write('401 Unauthorized')
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