import * as Phaser from 'phaser';
import { setElementProperty } from './dom-elements';
import { Client } from "colyseus.js";

const BALL_TYPES = {
  STRIPPES: 'STRIPES',
  FULL: 'FULL',
  NONE: 'NONE'
};

const getBallType = (number) => number < 8 ? BALL_TYPES.STRIPPES : BALL_TYPES.FULL;

class Scene extends Phaser.Scene {
  constructor() {
    super();
    this.graphics;
    this.mouseFollow;
    this.stick;
    this.isPointerDown = false;
    this.POWER_INCREMENT = 0.4;
    this.POWER_MAXIMUM = 25;
    this.CURRENT_POWER = 0;
    this.roundInProgress = false;
    this.whiteballFaul = false;
    this.fullRemaining = 7;
    this.stripedRemaining = 7;
    this.currentBallType = undefined;
    this.ballTypeFaul = false;
    this.wrongYouchFaul = false;
    this.noYouchFaul = false;
    this.firstTouchType = undefined;
    this.hasRoundColision = false;
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
  }

  create ()
  {
    this.graphics = this.add.graphics();
    const table = this.physics.add.sprite(1253/2, 652/2, 'table');
    table.refreshBody();

    this.whiteball = this.physics.add.sprite(400, 300, 'whiteball');
    this.whiteball.setScale(0.6);
    this.whiteball.setDrag(0.75);
    this.whiteball.setBounce(0.8,0.8);
    this.whiteball.setCollideWorldBounds(true);
    this.whiteball.setCircle(35);
    this.whiteball.setDamping(true);
    this.whiteball.setName('white');

    this.input.enableDebug(this.whiteball, 0xff00ff);
    this.whiteball.setDebug(true, true, 0xff00ff);


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
    this.balls.push(this.whiteball);

    const boxes = [
      // hlavní stěny
      this.physics.add.sprite(65, 120, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 420),
      this.physics.add.sprite(1185, 120, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 420),
      this.physics.add.sprite(107, 79, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(470, 1),
      this.physics.add.sprite(632, 79, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(518, 1),
      this.physics.add.sprite(107, 580, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(470, 1),
      this.physics.add.sprite(632, 580, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(518, 1),

      // levá horní díra
      this.physics.add.sprite(26, 83, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      this.physics.add.sprite(40, 97, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      this.physics.add.sprite(52, 109, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),

      ...[[25, 62], [36, 46], [58, 41], [74, 49], [85, 60], [97, 69]].map(([x, y]) =>
        this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      ),
      ...[[42, 563], [24, 587], [31, 614], [48, 625], [68, 620], [84, 604], [96, 593]].map(([x, y]) =>
        this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      ),
      ...[[578,591],[579,606],[593,623],[618,625],[635,609],[639,600],[636,585]].map(([x, y]) =>
        this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      ),
      ...[[578,72],[580,54],[593,42],[614,39],[630,50],[637,68]].map(([x, y]) =>
        this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      ),
      ...[[1156,591],[1166,604],[1182,618],[1207,622],[1226,605],[1228,581],[1212,564],[1195,551]].map(([x, y]) =>
        this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      ),
      ...[[1157,72],[1171,57],[1191,43],[1218,46],[1232,66],[1228,86],[1214,100],[1199,111],[1193,116]].map(([x, y]) =>
        this.physics.add.sprite(x, y, 'rectangle').setImmovable(true).setAlpha(0).setOrigin(0, 0).setScale(1, 1),
      ),
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
        this.stick.x = this.whiteball.x;
        this.stick.y = this.whiteball.y;
        const angleBetween = Phaser.Math.Angle.Between(this.whiteball.x, this.whiteball.y, pointer.x, pointer.y);
        this.stick.angle = Phaser.Math.RadToDeg(angleBetween + Math.PI / 2);
      }

      if(this.whiteballFaul || this.ballTypeFaul) {
        this.whiteball.setPosition(pointer.x, pointer.y);
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

        this.stick.setOrigin(0.5,-0.065);

        console.log(`[${pointer.x},${pointer.y}]`);

        const newVel = this.physics.velocityFromAngle(this.stick.angle - 90, this.CURRENT_POWER * 55);
        this.whiteball.setVelocity(newVel.x,newVel.y);

        this.CURRENT_POWER = 0;
      }
    });
  }

  ballCollistion(ballOne, ballTwo) {
    let scoreBall;
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
    console.log({ ballOne, ballTwo, scoreBall, bt: getBallType(scoreBall),cb: this.currentBallType });
    if(typeof this.currentBallType !== 'undefined' && this.currentBallType !== getBallType(scoreBall)) {
      this.setBallTypeFaul();
    }
    this.currentBallType = getBallType(scoreBall);
    this.hasRoundColision = true;


  }

  clearFaul() {
    this.whiteballFaul = false;
    this.ballTypeFaul = false;
    setElementProperty('place-ball', 'hidden', true);
    this.whiteball.body.enable = true;
    if(typeof this.currentBallType !== 'undefined') {
      this.currentBallType = this.currentBallType === BALL_TYPES.STRIPPES ? BALL_TYPES.FULL : BALL_TYPES.STRIPPES;
    }
    this.roundInProgress = false;
  }

  setBallTypeFaul() {
    this.ballTypeFaul = true;
    setElementProperty('place-ball', 'hidden', undefined);
    this.whiteball.setVelocity(0, 0);
    this.whiteball.body.enable = false;
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
    if(ball.name !== 'white') {
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
      console.log(ball, number);
    }
    if(ball.name === 'white') {
      this.whiteballFaul = true;
      setElementProperty('place-ball', 'hidden', undefined);
      this.roundInProgress = false;
      this.whiteball.setVelocity(0, 0);
      this.whiteball.body.enable = false;
    }
  }

  manageWhiteBallVelocity() {
    const { x, y } = this.whiteball.body.velocity;
    /**
     * To speed up slowdown of the white ball
     */
    if(x !== 0 && y !== 0 && Math.abs(x) <= 0.9 && Math.abs(y) <= 0.9) {
      this.whiteball.setVelocity(0, 0);
      this.roundInProgress = false;
      this.hasRoundColision = false;
    }

  }

  update() {
    this.graphics.clear();

    if(this.isPointerDown && this.CURRENT_POWER <= this.POWER_MAXIMUM) {
      this.CURRENT_POWER += this.POWER_INCREMENT;

      // console.log(this.CURRENT_POWER);
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
      debug: true,
      gravity: {
        y: 0,
        x: 0
      }
    }
  },
  scene: [ Scene ]
};

const game = new Phaser.Game(config);

const client = new Client("ws://localhost:2567");

function connectById (id) {
  return client.joinById(id).then(room => {
    console.log(room);

    setElementProperty('your-room', 'textContent', "Your room is: " + room.id);

    room.onStateChange((newState) => {
      console.log("New state:", newState);
    });

    room.onLeave((code) => {
      console.log("You've been disconnected.", code);
    });
  })
    .catch(e  => {
      setElementProperty('error', 'textContent', "Couldn't connect: " + e);
    });
}

function createRoom () {
  return client.create("my_room").then(room => {
    console.log(room);

    setElementProperty('your-room', 'textContent', "Your room is: " + room.id);

    room.onStateChange((newState) => {
      console.log("New state:", newState);
    });

    room.onLeave((code) => {
      console.log("You've been disconnected.", code);
    });
  })
    .catch(e  => {
      setElementProperty('error', 'textContent', "Couldn't connect: " + e);
    });
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
