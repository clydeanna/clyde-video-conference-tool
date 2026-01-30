const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const rooms = {};

wss.on("connection", socket => {
  socket.on("message", message => {
    const data = JSON.parse(message);
    const { room } = data;

    rooms[room] = rooms[room] || [];
    rooms[room].push(socket);

    rooms[room].forEach(client => {
      if (client !== socket && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  });
});

console.log("Signaling server running on ws://localhost:3000");

