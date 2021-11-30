import * as Phaser from 'phaser';

class Scene extends Phaser.Scene {
  constructor() {
    super();
    this.graphics;
    this.mouseFollow;
    this.stick;
    this.isPointerDown = false;
    this.POWER_INCREMENT = 0.1;
    this.POWER_MAXIMUM = 10;
    this.CURRENT_POWER = 0;
  }

  preload ()
  {
    this.load.setBaseURL('/');
    this.objects = {};
    this.load.spritesheet('whiteball', 'assets/whiteball.png', {frameWidth: 69, frameHeight: 68});
    this.load.image('table', 'assets/table.png');
    this.load.spritesheet('stick', 'assets/stick.png', {frameWidth: 11, frameHeight: 455});
    this.load.spritesheet('rectangle', 'assets/rectangle.png', {frameWidth: 1, frameHeight: 1});
  }

  create ()
  {
    this.graphics = this.add.graphics();
    const table = this.physics.add.sprite(1253/2, 652/2, 'table');
    table.refreshBody();

    this.whiteball = this.physics.add.sprite(400, 300, 'whiteball');
    this.whiteball.setScale(0.6);
    this.whiteball.setDrag(10, 10);
    this.whiteball.setBounce(1,1);
    this.whiteball.setCollideWorldBounds(true);
    this.whiteball.setCircle(35);

    this.input.enableDebug(this.whiteball, 0xff00ff);
    this.whiteball.setDebug(true, true, 0xff00ff);

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

    this.physics.add.collider(table, this.whiteball);
    this.physics.add.collider(boxes, this.whiteball);

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
        const point =  Phaser.Math.RotateAroundDistance({x: this.whiteball.x, y: this.whiteball.y}, this.stick.x, this.stick.y, this.stick.angle, 50);
        this.stick.x = this.whiteball.x;
        this.stick.y = this.whiteball.y;
        const angleBetween = Phaser.Math.Angle.Between(this.whiteball.x, this.whiteball.y, pointer.x, pointer.y);
        //console.log({angleBetween, inGed: Phaser.Math.Angle.WrapDegrees(angleBetween)})
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
      //console.log('INPUT DOWN');
      this.isPointerDown = true;
    });

    this.input.on('pointerup', (pointer) => {
      //console.log('INPUT UP');
      this.isPointerDown = false;
      //this.stick.x = pointer.x
      //this.stick.y = pointer.y

      this.stick.setOrigin(0.5,-0.065);

      const newVel = this.physics.velocityFromAngle(this.stick.angle - 90, 150);
      this.whiteball.setVelocity(newVel.x,newVel.y);

      this.CURRENT_POWER = 0;
    });
  }

  update() {
    this.graphics.clear();

    if(this.isPointerDown && this.CURRENT_POWER <= this.POWER_MAXIMUM) {
      this.CURRENT_POWER += this.POWER_INCREMENT;

      //console.log(this.CURRENT_POWER);
      this.stick.setOrigin(0.5, -0.065 - Math.min(this.CURRENT_POWER / 100, 0.1));
    }

    this.graphics.lineStyle(1, 0x5391c9, 1);

    this.graphics.strokeCircleShape(this.mouseFollow);
  }
}


const config = {
  type: Phaser.AUTO,
  width: 1253,
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

