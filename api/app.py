from flask import Flask, send_from_directory
from dotenv import load_dotenv

from api import api_bp

load_dotenv()
static_path = '../static'
templates_path = '../templates'

def create_app():
    app = Flask(__name__)

    # Serve static files (JS, CSS and images)
    @app.route('/static/<path>', methods=['GET'])
    def static_proxy(path):
        return send_from_directory(static_path, path)

    # Routes at / managed by client-side routing
    @app.route('/', methods=['GET'])
    def home():
        return send_from_directory(templates_path, 'index.html')
    
    @app.route('/<path:path>', methods=['GET'])
    def home_other(path):
        return send_from_directory(templates_path, 'index.html')

    # Serve API endpoints
    app.register_blueprint(api_bp)
    
    return app
