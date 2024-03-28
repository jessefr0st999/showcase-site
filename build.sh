pip install .
npm install
sed -i 's@localhost:7000@'"$WEBSOCKET_HOST"'@' src/secrets.js
npm run build