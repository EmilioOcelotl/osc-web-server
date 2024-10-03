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

// Configurar servidor OSC para recibir mensajes
const oscServer = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 57120,  // Cambia este puerto si es necesario
});

// Mantener un array de conexiones WebSocket
const clients = [];

// Configurar WebSocket para comunicación con el cliente (página web)
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Cliente conectado a WebSocket');
  
  // Agregar el cliente a la lista
  clients.push(ws);

  // Cuando un cliente se desconecta, eliminarlo de la lista
  ws.on('close', () => {
    console.log('Cliente desconectado del WebSocket');
    const index = clients.indexOf(ws);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });

  // Aquí no creamos un nuevo servidor OSC, ya que ya existe uno.
});

// Manejar mensajes OSC
oscServer.on('message', (oscMsg) => {
  console.log('Mensaje OSC recibido:', oscMsg);

  // Guardar el mensaje OSC en la base de datos SQLite
  const address = oscMsg.address;
  const args = JSON.stringify(oscMsg.args);
  const numarg = oscMsg.args; 
  const timestamp = new Date().toISOString();

  db.run(`INSERT INTO osc_messages (address, args, timestamp) VALUES (?, ?, ?)`, [address, args, timestamp], function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Mensaje guardado en SQLite con id: ${this.lastID}`);

    // Enviar el mensaje OSC a todos los clientes conectados
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ address, numarg, timestamp }));
      }
    });
  });
});

// Abrir el servidor OSC
oscServer.open();

console.log('Servidor WebSocket y OSC corriendo...');
