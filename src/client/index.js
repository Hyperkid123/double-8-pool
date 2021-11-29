import * as Phaser from 'phaser';

class Scene extends Phaser.Scene {
    constructor() {
        super()
        this.graphics;
        this.mouseFollow
        this.stick
    }

    preload ()
    {
        this.load.setBaseURL('/')
        this.objects = {};
        this.load.spritesheet('whiteball', 'assets/whiteball.png', {frameWidth: 69, frameHeight: 68})
        this.load.image('table', 'assets/table.png')
        this.load.spritesheet('stick', 'assets/stick.png', {frameWidth: 11, frameHeight: 455})
    }   

    create ()
{
    this.graphics = this.add.graphics();
    const table = this.physics.add.staticImage(1253/2, 652/2, 'table').refreshBody()
    const whiteball = this.physics.add.sprite(400, 300, 'whiteball');    
    this.stick = this.physics.add.sprite(100, 100, 'stick');    
    this.mouseFollow = new Phaser.Geom.Circle(0, 0, 25)
    this.objects.camera = this.cameras.add(0, 0, 800, 600);
    this.input.on('pointermove', pointer => {
        this.mouseFollow.x = pointer.x
        this.mouseFollow.y = pointer.y
        this.stick.x = pointer.x
        this.stick.y = pointer.y
    })
}

update() {
    this.graphics.clear();

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
            gravity: {
                y: 0,
                x: 0
            }
        }
    },
    scene: [ Scene ]
}

const game = new Phaser.Game(config);