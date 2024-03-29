pip install .
npm install
sed -i 's@ws://localhost:7000@'"$WEBSOCKET_URI"'@' src/secrets.js
npm run build