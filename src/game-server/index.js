const { Server, Room } = require('colyseus');
const express = require('express');
const { createServer } = require('http');

class MyRoom extends Room {
  // number of clients per room
  // (colyseus will create the room instances for you)
  maxClients = 2;
  rooms = {};

  mapEachPlayer(callback, roomId) {
    return Object.keys(this.rooms[roomId].players).map(player => callback(player, this.rooms[roomId].players[player]));
  }

  updateEachPlayer(callback, roomId) {
    Object.keys(this.rooms[roomId].players).forEach(player => {
      this.rooms[this.roomId].players[player] = {
        ...this.rooms[this.roomId].players[player],
        ...callback(player, this.rooms[this.roomId].players[player])
      };
    });
  }

  // room has been created: bring your own logic
  async onCreate(options) {
    console.log('onCreate');
    const roomId = this.roomId;
    //this.setState({status: "Waiting for other player"});
    this.onMessage("stroke", (client, stroke) => {


      console.log("stroke: ", client.id, stroke, this.rooms[roomId].players);
      this.rooms[roomId].players[client.id].stroke = stroke;

      if(this.mapEachPlayer((_, { stroke }) => !!stroke, roomId).every((bool) => bool)) {
        this.broadcast('turn-ended', this.mapEachPlayer((player, {stroke}) => ({player, stroke, ballsStopped: false}), roomId));

        this.updateEachPlayer(() => ({stroke: undefined}), roomId);
      }
    });

    this.onMessage('reset-white', (_, { ballIndex }) => {
      this.broadcast('reset-white', { ballIndex });
      this.updateEachPlayer(() => ({stroke: undefined}), roomId);
    });

    this.onMessage('balls-stopped', client => {
      this.rooms[roomId].players[client.id].ballsStopped = true;
      console.log('balls-stopped-signal');
      if(this.mapEachPlayer((_, { ballsStopped }) => ballsStopped, roomId).every((bool) => bool)) {
        this.broadcast('end-round');
      }
    });

    this.onMessage('balls-sync', (_, balls ) => {
      this.broadcast('balls-sync', balls);
    });

    this.onMessage('player-win', (_, { clientId, oppositeId }) => {
      this.broadcast('game-ended', { id: clientId || Object.keys(this.rooms[this.roomId].this.players).first(id => id !== oppositeId) });
    });
  }

  // client joined: bring your own logic
  async onJoin(client, options) {
    console.log('onJoin', this.roomId);

    if(!this.rooms[this.roomId]) {
      this.rooms[this.roomId] = {
        players: {}
      };
    }
    if(Object.keys(this.rooms[this.roomId].players).length === this.maxClients) {
      console.log('Room is full callback');
      return;
    }
    this.rooms[this.roomId].players[client.id] = {
      balls: undefined,
      stroke: undefined,
      ballsStopped: true,
    };

    console.log(this.rooms);
    if(Object.keys(this.rooms[this.roomId].players).length === this.maxClients) {
      /**
       * Send signal for host to create pahzer game instance
       */
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
