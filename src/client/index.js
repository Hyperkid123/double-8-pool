import * as Phaser from 'phaser';

function preload ()
{
    this.load.setBaseURL('/')
    this.objects = {};
    this.load.image('black-ball', 'assets/black-ball.png')
    this.load.image('table', 'assets/table.png')
}

function create ()
{
    const table = this.add.image(1253/2, 652/2, 'table')
    const blackBall = this.physics.add.image(400, 300, 'black-ball');
    this.objects.camera = this.cameras.add(0, 0, 800, 600);
    blackBall.setVelocity(100, 200);
    blackBall.setBounce(1, 1);
    blackBall.setCollideWorldBounds(true);
    // this.objects.camera.setBackgroundColor('rgba(255, 0, 0, 0.5)');
}

function update() {
    const self = this
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
    scene: {
        preload,
        create,
        update
    }
}

const game = new Phaser.Game(config);