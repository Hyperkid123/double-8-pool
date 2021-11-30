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

    this.physics.add.collider(table, this.whiteball);

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
      console.log('INPUT DOWN');
      this.isPointerDown = true;
    });

    this.input.on('pointerup', (pointer) => {
      console.log('INPUT UP');
      this.isPointerDown = false;
      //this.stick.x = pointer.x
      //this.stick.y = pointer.y

      this.stick.setOrigin(0.5,-0.065);

      const newVel = this.physics.velocityFromAngle(this.stick.angle - 90, 100);
      this.whiteball.setVelocity(newVel.x,newVel.y);

      this.CURRENT_POWER = 0;
    });
  }

  update() {
    this.graphics.clear();

    if(this.isPointerDown && this.CURRENT_POWER <= this.POWER_MAXIMUM) {
      this.CURRENT_POWER += this.POWER_INCREMENT;

      console.log(this.CURRENT_POWER);
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

