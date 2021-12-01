const { Server, Room } = require('colyseus');
const express = require('express');
const { createServer } = require('http');

class MyRoom extends Room {
  // number of clients per room
  // (colyseus will create the room instances for you)
  maxClients = 2;

  mapEachPlayer(callback) {
    return Object.keys(this.players).map(player => callback(player, this.players[player]));
  }

  updateEachPlayer(callback) {
    Object.keys(this.players).forEach(player => {
      this.players[player] = {
        ...this.players[player],
        ...callback(player, this.players[player])
      };
    });
  }

  // room has been created: bring your own logic
  async onCreate(options) {
    console.log('onCreate');

    this.players = {};

    //this.setState({status: "Waiting for other player"});
    this.onMessage("stroke", (client, stroke) => {
      console.log("stroke: ", client.id, stroke);

      this.players[client.id].stroke = stroke;

      if(this.mapEachPlayer((_, { stroke }) => !!stroke).every((bool) => bool)) {
        this.broadcast('turn-ended', this.mapEachPlayer((player, {stroke}) => ({player, stroke})));

        this.updateEachPlayer(() => ({stroke: undefined}));
      }
    });
  }

  // client joined: bring your own logic
  async onJoin(client, options) {
    console.log('onJoin', options, client);

    this.players[client.id] = {
      balls: undefined,
      stroke: undefined
    };

    console.log(this.players);
    if(Object.keys(this.players).length === this.maxClients) {
      this.broadcast('oponent-joined');
    }
  }

  // client left: bring your own logic
  async onLeave(client, consented) {
    // console.log('client',client, consented);
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
