const osc = require('osc');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

// Crear o abrir la base de datos SQLite
let db = new sqlite3.Database('./oscMessages.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Conectado a la base de datos SQLite.');

  // Crear una tabla si no existe
  db.run(`CREATE TABLE IF NOT EXISTS osc_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT,
    args TEXT,
    timestamp TEXT
  )`);
});

// Configurar WebSocket para comunicación con el cliente (página web)
const wss = new WebSocket.Server({ port: 8082 });

wss.on('connection', (ws) => {
  console.log('Cliente conectado a WebSocket');

  // Configurar servidor OSC para recibir mensajes
  const oscServer = new osc.UDPPort({
    localAddress: '0.0.0.0',
    localPort: 57120,  // Cambia este puerto si es necesario
  });

  oscServer.on('message', (oscMsg) => {
    console.log('Mensaje OSC recibido:', oscMsg);

    // Guardar el mensaje OSC en la base de datos SQLite
    const address = oscMsg.address;
    const args = JSON.stringify(oscMsg.args);
    const timestamp = new Date().toISOString();

    db.run(`INSERT INTO osc_messages (address, args, timestamp) VALUES (?, ?, ?)`, [address, args, timestamp], function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Mensaje guardado en SQLite con id: ${this.lastID}`);

      // Enviar el mensaje OSC al cliente (página web) por WebSocket
      ws.send(JSON.stringify({ address, args, timestamp }));
    });
  });

  oscServer.open();
});

console.log('Servidor WebSocket y OSC corriendo...');
