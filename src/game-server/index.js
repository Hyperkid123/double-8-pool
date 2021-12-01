const { Server, Room } = require('colyseus');
const express = require('express');
const { createServer } = require('http');

class MyRoom extends Room {
  // number of clients per room
  // (colyseus will create the room instances for you)
  maxClients = 2;

  // room has been created: bring your own logic
  async onCreate(options) {
    console.log('onCreate',options);
  }

  // client joined: bring your own logic
  async onJoin(client, options) {
    console.log('onJoin',client, options);
  }

  // client left: bring your own logic
  async onLeave(client, consented) {
    console.log('client',client, consented);
  }

  // room has been disposed: bring your own logic
  async onDispose() {
    console.log('onDispose');
  }
}

const app = express();
app.use(express.json());

const gameServer = new Server({
  server: createServer(app)
});

gameServer.define('my_room', MyRoom);

gameServer.listen(2567);
console.log(`Listening on ws://localhost:2567`);
