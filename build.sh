pip install .
npm install
sed -i 's@ws://localhost:7000@wss://'"$WEBSOCKET_HOST"'@' src/secrets.js
npm run build