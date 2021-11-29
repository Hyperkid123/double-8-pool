import * as Phaser from 'phaser';

let graphics;
let mouseFollow;

class Scene extends Phaser.Scene {
    constructor() {
        super()
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
    graphics = this.add.graphics();
    const table = this.physics.add.staticImage(1253/2, 652/2, 'table').refreshBody()
    const whiteball = this.physics.add.sprite(400, 300, 'whiteball');    
    const stick = this.physics.add.sprite(100, 100, 'stick');    
    mouseFollow = new Phaser.Geom.Circle(0, 0, 25)
    this.objects.camera = this.cameras.add(0, 0, 800, 600);
    // blackBall.setVelocity(100, 200);
    // blackBall.setBounce(1, 1);
    // blackBall.setCollideWorldBounds(true);
    // this.objects.camera.setBackgroundColor('rgba(255, 0, 0, 0.5)');
    this.input.on('pointermove', pointer => {
        mouseFollow.x = pointer.x
        mouseFollow.y = pointer.y
        this.children.bringToTop(mouseFollow)
        console.log(this.children)
    })
}

update() {
    graphics.clear();

    graphics.lineStyle(1, 0x5391c9, 1);

    graphics.strokeCircleShape(mouseFollow);    
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