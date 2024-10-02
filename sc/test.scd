(
var serverAddr;
serverAddr = NetAddr("localhost", 57120);  // Cambia la IP y puerto según tu servidor
serverAddr.sendMsg("/mi_mensaje", 100, "hola");  // Envía un mensaje OSC
)