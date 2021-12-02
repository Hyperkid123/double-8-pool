import * as Phaser from 'phaser';
import { setElementProperty } from './dom-elements';
import { Client } from "colyseus.js";

const BALL_TYPES = {
  STRIPPES: 'STRIPES',
  FULL: 'FULL',
  NONE: 'NONE'
};

const getBallType = (number) => number < 8 ? BALL_TYPES.STRIPPES : BALL_TYPES.FULL;

let roomInstance;
let ballIndex;
let clientId;
let moveBall;
let oponentConnected = false;
let resetBall;
let endRound;
let resetWait;
let ballsSync;
class Scene extends Phaser.Scene {
  constructor() {
    super();
    this.syncNumber = 0;
    this.graphics;
    this.mouseFollow;
    this.stick;
    this.isPointerDown = false;
    this.POWER_INCREMENT = 0.4;
    this.POWER_MAXIMUM = 25;
    this.CURRENT_POWER = 0;
    this.roundInProgress = false;
    this.fullRemaining = 7;
    this.stripedRemaining = 7;
    this.currentBallType = undefined;
    this.firstTouchType = undefined;
    this.hasRoundColision = false;
    this.waitingForOponentStroke = true;
    this.updateCounter = 0;

    this.myBalls = ballIndex ? BALL_TYPES.STRIPPES : BALL_TYPES.FULL;
    setElementProperty('game-status', 'textContent', `You have: ${this.myBalls} balls.`);
  }

  preload ()
  {
    this.load.setBaseURL('/');
    this.objects = {};
    this.load.spritesheet('whiteball', 'assets/whiteball.png', {frameWidth: 69, frameHeight: 68});
    this.load.image('table', 'assets/table.png');
    this.load.spritesheet('stick', 'assets/stick.png', {frameWidth: 11, frameHeight: 455});
    this.load.spritesheet('rectangle', 'assets/rectangle.png', {frameWidth: 1, frameHeight: 1});


    [...new Array(15)].forEach((_, index) => {
      this.load.spritesheet(`${index + 1}ball`, `assets/${index + 1}.png`, {frameWidth: 69, frameHeight: 68});
    });

    /**
     * Load audio files
     */
    this.load.audio('background-noise', 'assets/sounds/background-noise.mp3');
    this.load.audio('ball-in-hole', 'assets/sounds/ball-in-hole.mp3');
    this.load.audio('ball-touch-sides', 'assets/sounds/ball-touch-sides.mp3');
    this.load.audio('gasp', 'assets/sounds/gasp.mp3');
    this.load.audio('high-clap', 'assets/sounds/high-clap.mp3');
    this.load.audio('high-velocity-hit-2', 'assets/sounds/high-velocity-hit-2.mp3');
    this.load.audio('high-velocity-hit', 'assets/sounds/high-velocity-hit.mp3');
    this.load.audio('low-velocity-hit', 'assets/sounds/low-velocity-hit.mp3');
    this.load.audio('mid-clap', 'assets/sounds/mid-clap.mp3');
    this.load.audio('mid-velocity-hit', 'assets/sounds/mid-velocity-hit.mp3');
    this.load.audio('stick-ball-hit', 'assets/sounds/stick-ball-hit.mp3');

  }

  createWhiteBall(x, y, index) {
    const ball = this.physics.add.sprite(x, y, 'whiteball')
      .setScale(0.6)
      .setDrag(0.75)
      .setBounce(0.8,0.8)
      .setCollideWorldBounds(true)
      .setCircle(35)
      .setDamping(true)
      .setName('white')
      .setData({
        localPlayer: index === ballIndex
      })
      .setDebug(true, true, 0xff00ff);
    this.input.enableDebug(ball, 0xff00ff);

    return ball;
  }

  createBarrier(x,y, scaleX = 1, scaleY = 1) {
    return this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(scaleX, scaleY);
  }

  create ()
  {
    moveBall = this.moveBall.bind(this);
    resetBall = this.resetBall.bind(this);
    endRound = this.endRound.bind(this);
    resetWait = this.resetWait.bind(this);
    ballsSync = ballIndex === 0 ? () => {} : this.ballsSync.bind(this);
    this.graphics = this.add.graphics();
    const table = this.physics.add.sprite(1253/2, 652/2, 'table');
    table.refreshBody();
    this.whiteBallsPositions = [[213, 225], [213, 435]];

    this.whiteball1 = this.createWhiteBall(...this.whiteBallsPositions[0], 0);
    this.whiteball2 = this.createWhiteBall(...this.whiteBallsPositions[1], 1);
    this.whiteballs = [this.whiteball1, this.whiteball2];

    const holes = [[50,60], [50,600], [610,600], [1200,600], [1200,60], [610,60]].map(([x, y]) =>
      this.physics.add.sprite(x, y, 'whiteball').setScale(0.1, 0.1).setCircle(30).setAlpha(0)
    );

    this.balls = [
      [800,321, 1],

      [837,295, 13],
      [837,347, 10],

      [877,273, 6],
      [876,321, 8],
      [877,368, 3],

      [915,249, 9],
      [915,299, 2],
      [915,344, 4],
      [916,389, 14],

      [955,230, 12],
      [955,279, 7],
      [955,324, 11],
      [955,369, 5],
      [955,414, 15],
    ].map(([x, y, index]) =>
      this.physics.add.sprite(x, y, `${index}ball`).setScale(0.6).setBounce(0.8, 0.8).setDrag(0.75).setCircle(35).setDamping(true).setName(`${index}-ball`)
    );
    this.balls.push(this.whiteball1);
    this.balls.push(this.whiteball2);

    const boxes = [
      // hlavní stěny
      this.createBarrier(65, 120, 1, 420),
      this.createBarrier(1185, 120, 1, 420),
      this.createBarrier(107, 79, 470),
      this.createBarrier(632, 79, 518),
      this.createBarrier(107, 580, 470),
      this.createBarrier(632, 580, 518),

      ...[
        [26, 83], [40, 97], [52, 109],
        [25, 62], [36, 46], [58, 41], [74, 49], [85, 60], [97, 69],
        [42, 563], [24, 587], [31, 614], [48, 625], [68, 620], [84, 604], [96, 593],
        [578,591],[579,606],[593,623],[618,625],[635,609],[639,600],[636,585],
        [578,72],[580,54],[593,42],[614,39],[630,50],[637,68],
        [1156,591],[1166,604],[1182,618],[1207,622],[1226,605],[1228,581],[1212,564],[1195,551],
        [1157,72],[1171,57],[1191,43],[1218,46],[1232,66],[1228,86],[1214,100],[1199,111],[1193,116]
      ].map(([x, y]) => this.createBarrier(x, y)),
    ];

    this.physics.add.collider(boxes, this.balls);
    this.physics.add.collider(this.balls, this.balls, this.ballCollistion, null, this);
    this.physics.add.overlap(this.balls, holes, this.ballInHole, null, this);

    this.stick = this.physics.add.sprite(100, 100, 'stick');
    this.stick.setOrigin(0.5, -0.065);
    this.stick.setRotation(Math.PI / 2);
    window.stick = this.stick;
    this.mouseFollow = new Phaser.Geom.Circle(0, 0, 25);
    this.objects.camera = this.cameras.add(0, 0, 800, 600);
    this.input.on('pointermove', pointer => {
      if(!this.isPointerDown) {
        this.mouseFollow.x = pointer.x;
        this.mouseFollow.y = pointer.y;
        this.stick.x = this.whiteballs[ballIndex].x;
        this.stick.y = this.whiteballs[ballIndex].y;
        const angleBetween = Phaser.Math.Angle.Between(this.whiteballs[ballIndex].x, this.whiteballs[ballIndex].y, pointer.x, pointer.y);
        this.stick.angle = Phaser.Math.RadToDeg(angleBetween + Math.PI / 2);
      }
    });
    this.input.on('wheel', (_a, _b, _c, delta) => {
      if(delta > 0) {
        this.stick.angle += 5;
      } else if (delta < 0) {
        this.stick.angle -= 5;
      }
    });

    this.input.on('pointerdown', () => {
      if(!this.roundInProgress && !this.whiteballFaul && !this.ballTypeFaul) {
        this.isPointerDown = true;
      }
      if(this.whiteballFaul || this.ballTypeFaul) {
        this.clearFaul();
      }
    });

    this.input.on('pointerup', (pointer) => {
      if(!this.roundInProgress) {
        this.isPointerDown = false;
        this.roundInProgress = true;
        this.waitingForOponentStroke = true;

        this.stick.setOrigin(0.5,-0.065);

        const newVel = this.physics.velocityFromAngle(this.stick.angle - 90, this.CURRENT_POWER * 55);
        this.CURRENT_POWER = 0;

        roomInstance.send("stroke", {angle: this.stick.angle, velocity: newVel});
      }
    });

    this.sounds = {};
    this.sounds.bgNoise = this.game.sound.add('background-noise');
    this.sounds.ballInHole = this.game.sound.add('ball-in-hole');
    this.sounds.ballTouchSides = this.game.sound.add('ball-touch-sides');
    this.sounds.gasp = this.game.sound.add('gasp');
    this.sounds.highClap = this.game.sound.add('high-clap');
    this.sounds.highVH2 = this.game.sound.add('high-velocity-hit-2');
    this.sounds.highVH = this.game.sound.add('high-velocity-hit');
    this.sounds.lowVH = this.game.sound.add('low-velocity-hit');
    this.sounds.midClap = this.game.sound.add('mid-clap');
    this.sounds.midVH = this.game.sound.add('mid-velocity-hit');
    this.sounds.stickBallHit = this.game.sound.add('stick-ball-hit');

    this.sounds.bgNoise.loop = true;
    this.sounds.bgNoise.play();
  }

  moveBall(data, index) {
    this.whiteballs[index].setVelocity(data.stroke.velocity.x, data.stroke.velocity.y);
  }

  resetBall(index) {
    this.whiteballs[index].setVelocity(0, 0);
    this.whiteballs[index].setPosition(...this.whiteBallsPositions[index]);
  }

  endRound() {
    this.roundInProgress = false;
    this.manageSyncServer(true);
  }

  resetWait() {
    this.sounds.stickBallHit.play();
    this.waitingForOponentStroke = false;
    this.manageSyncServer(true);
  }

  ballCollistion(ballOne, ballTwo) {
    let scoreBall;
    const maxVelocity = Math.max(Math.abs(ballOne.body.velocity.x), Math.abs(ballOne.body.velocity.y), Math.abs(ballTwo.body.velocity.x), Math.abs(ballTwo.body.velocity.y));
    if(maxVelocity > 500) {
      Math.random() * 10 > 5 ? this.sounds.highVH.play() : this.sounds.highVH2.play();
    } else if (maxVelocity <= 500 && maxVelocity > 200) {
      this.sounds.midVH.play();
    } else {
      this.sounds.lowVH.play();
    }

    if(this.hasRoundColision && (ballOne.name !== 'white' || ballTwo !== 'white')) {
      /**
       * do not process score balls collision or subsequent white balls collisions
       */
      return;
    }
    if(ballOne.name === 'white') {
      scoreBall = ballTwo;
    } else {
      scoreBall = ballOne;
    }
    if(typeof this.currentBallType !== 'undefined' && this.currentBallType !== getBallType(scoreBall)) {
      this.setBallTypeFaul();
    }
    this.currentBallType = getBallType(scoreBall);
    this.hasRoundColision = true;


  }

  clearFaul() {
  }

  setBallTypeFaul() {
  }

  checkWinCondition() {
    /**
     * Nechal sem to rozdelene at se ty podminky lepe ctou
     */
    if(this.currentBallType === BALL_TYPES.FULL && this.fullRemaining !== 0) {
      console.log('CURRENT PLAYER LOST');
    } else if (this.currentBallType === BALL_TYPES.STRIPPES && this.stripedRemaining !== 0) {
      console.log('CURRENT PLAYER LOST');
    } else if(this.currentBallType === BALL_TYPES.FULL && this.fullRemaining === 0) {
      console.log('CURRENT PLAYER WON');
    } else if(this.currentBallType === BALL_TYPES.STRIPPES && this.stripedRemaining === 0) {
      console.log('CURRENT PLAYER WON');
    }
  }

  ballInHole(ball, hole) {
    this.sounds.ballInHole.play();
    if(ball.name !== 'white') {
      this.sounds.midClap.play();
      const number = Number(ball.name.split('-').shift());
      if(number === 8) {
        if(typeof this.currentBallType!== 'undefined') {
          this.checkWinCondition();
        }
      }
      const ballType = getBallType(number);
      if(typeof this.currentBallType !== 'undefined' && ballType !== this.currentBallType) {
        this.setBallTypeFaul();
      }

      this.currentBallType = ballType;

      ball.x = 1400;
      if(ballType === BALL_TYPES.FULL) {
        ball.y = 500;
        this.fullRemaining -= 1;
      } else {
        ball.y = 150;
        this.stripedRemaining -= 1;
      }
      ball.setVelocity(0, 0);
      this.checkWinCondition();
    }
    if(ball.name === 'white' && ball.data.get('localPlayer')) {
      // this.whiteballFaul = true;
      // setElementProperty('place-ball', 'hidden', undefined);
      // this.roundInProgress = false;
      this.sounds.gasp.pla();
      roomInstance.send('reset-white', { ballIndex });
    }
  }

  manageWhiteBallVelocity() {

    if(!this.waitingForOponentStroke && this.roundInProgress) {
      const ballsStopped = this.whiteballs.every((_, index) => {
        const { x, y } = this.whiteballs[index].body.velocity;
        /**
         * To speed up slowdown of the white ball
         */
        return Math.abs(x) <= 0.9 && Math.abs(y) <= 0.9;
      });

      if(ballsStopped) {
        this.whiteballs.forEach((_, index) => {
          this.whiteballs[index].setVelocity(0, 0);
        });
        this.hasRoundColision = false;
        roomInstance.send('balls-stopped');
        this.roundInProgress = false;
      }
    }

  }

  ballsSync({balls, syncNumber}) {
    if(syncNumber > this.syncNumber) {
      balls.forEach(({ velocity, position, angle, rotation }, index) => {
        this.balls[index].setVelocity(velocity.x, velocity.y);
        this.balls[index].setPosition(position.x, position.y);
        this.balls[index].setAngle(angle);
        this.balls[index].setRotation(rotation);
        this.balls[index].setOrigin(0.5, 0.5);
      });
      this.syncNumber = syncNumber;
    }
  }

  manageSyncServer(force = false) {
    if(ballIndex === 0) {
      if(force || this.updateCounter >= 10) {
        this.updateCounter = 0;
        const ballsData = this.balls.map((ball) => ({name: ball.name, velocity: ball.body.velocity, newVelocity: ball.body.newVelocity, position: { x: ball.x, y: ball.y }, angle: ball.body.angle, rotation: ball.body.rotation}));
        this.syncNumber += 1;
        roomInstance.send('balls-sync', {syncNumber: this.syncNumber, balls: ballsData});
      } else {
        this.updateCounter += 1;
      }
    }
  }

  update() {
    this.graphics.clear();

    if(this.isPointerDown && this.CURRENT_POWER <= this.POWER_MAXIMUM) {
      this.CURRENT_POWER += this.POWER_INCREMENT;

      this.stick.setOrigin(0.5, -0.025 - Math.min(this.CURRENT_POWER / 100, 0.1));
    }

    this.graphics.lineStyle(1, 0x5391c9, 1);

    this.graphics.strokeCircleShape(this.mouseFollow);
    setElementProperty('debug', 'textContent', JSON.stringify({
      whiteballFaul: this.whiteballFaul,
      ballTypeFaul: this.ballTypeFaul,
      roundInProgress: this.roundInProgress,
      currentBallType: this.currentBallType,
      hasRoundColision: this.hasRoundColision
    }, null, 2));

    this.manageSyncServer();

    if(this.roundInProgress) {
      this.stick.setAlpha(0);
      this.manageWhiteBallVelocity();
    } else {
      this.stick.setAlpha(1);
    }

  }
}


const config = {
  type: Phaser.AUTO,
  width: 1600,
  height: 632,
  physics: {
    default: 'arcade',
    arcade: {
      fps: 50,
      debug: true,
      gravity: {
        y: 0,
        x: 0
      }
    }
  },
  parent: document.getElementById('game-container'),
  backgroundColor: '#FFFFFF',
  scene: [ Scene ]
};

let game;

const client = new Client("ws://localhost:2567");

function onLeave(code) {
  console.log("You've been disconnected.", code);
}
function catchError(e) {
  setElementProperty('error', 'textContent', "Couldn't connect: " + e);
  document.getElementById('error').hidden = false;
}
function turnEnded(data) {
  data.forEach((d) => {
    moveBall(d, d.player === clientId ? ballIndex : ballIndex === 0 ? 1 : 0);
  });
  resetWait();
}

function ballReset({ballIndex}) {
  resetBall(ballIndex);
}

function endRoundMessage() {
  endRound();
}

function ballsSyncMessage(data) {
  ballsSync(data);
}

function connectById (id) {
  return client.joinById(id).then(room => {
    roomInstance = room;
    clientId = room.sessionId;
    setElementProperty('your-room', 'textContent', "Your room is: " + room.id + ' | ');
    ballIndex = 1;
    game = new Phaser.Game(config);
    room.onMessage('turn-ended', turnEnded);
    room.onMessage('reset-white',ballReset);
    room.onMessage('end-round', endRoundMessage);
    room.onMessage('balls-sync', ballsSyncMessage);
    room.onLeave(onLeave);
    console.log('Oponent connected', clientId);
    document.getElementById("hidden-form").hidden = true;
    document.getElementById('error').hidden = true;
    setElementProperty('waiting', 'hidden', true);
  })
    .catch(catchError);
}

function oponentJoined() {
  oponentConnected = true;
  setElementProperty('waiting', 'hidden', true);
  game = new Phaser.Game(config);
}

function createRoom () {
  return client.create("my_room").then(room => {
    roomInstance = room;
    clientId = room.sessionId;
    setElementProperty('your-room', 'textContent', "Your room is: " + room.id + ' | ');
    setElementProperty('waiting', 'textContent', "Copied to clipboard | Waiting for oponent");
    ballIndex = 0;
    room.onMessage('turn-ended', turnEnded);
    room.onLeave(onLeave);
    room.onMessage('reset-white',ballReset);
    room.onMessage('end-round', endRoundMessage);
    room.onMessage('oponent-joined', oponentJoined);
    console.log('You have created a room');
    document.getElementById('error').hidden = true;
    document.getElementById("hidden-form").hidden = true;
    navigator?.clipboard?.writeText(room.id);
  })
    .catch(catchError);
}

document.getElementById("connect-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const room = event.target.elements.room.value;

  console.log('connecting to room: ', room);

  connectById(room);
});

document.getElementById("create-room").addEventListener("click", (event) => {
  event.preventDefault();
  createRoom();
});

document.getElementById("connect-input").addEventListener("keyup", (event) => {
  document.getElementById("connect-button").disabled = !event.target.value;
});

document.getElementById("connect-room-button").addEventListener("click", () => {
  document.getElementById("hidden-form").hidden = !document.getElementById("hidden-form").hidden;
});