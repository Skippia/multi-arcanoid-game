import Phaser from "phaser"
import tilemapJson from '../../assets/tilemap.json'
import objectsPng from '../../assets/objects.png'
import bgSpace from '../../assets/bg-space.png'
import objectsJson from '../../assets/objects.json'
import ball from '../../assets/ball.png'

import bgFinishWin from '../../assets/gamewin.jpg'
import bgFinishLost from '../../assets/gameover.png'


import btnSingle from '../../assets/btn-single.png'
import btnTwo from '../../assets/btn-two.png'
import HP from '../../assets/your-hp.png'
import HPEnemy from '../../assets/enemy-hp.png'
import time3 from '../../assets/time3.png'
import time2 from '../../assets/time2.png'
import time1 from '../../assets/time1.png'
import blockstone from '../../assets/blockstone.png'



export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload')
    }
    preload() {
        this.load.image('bgSpace', bgSpace)
        this.load.image('bgFinishWin', bgFinishWin)
        this.load.image('bgFinishLost', bgFinishLost)
        this.load.tilemapTiledJSON('tilemap', tilemapJson)
        this.load.atlas('objects', objectsPng, objectsJson)
        this.load.image('ball', ball)
        this.load.image('btnSingle', btnSingle)
        this.load.image('btnTwo', btnTwo)
        this.load.image('HP', HP)
        this.load.image('HPEnemy', HPEnemy)
        this.load.image('time3', time3)
        this.load.image('time2', time2)
        this.load.image('time1', time1)
        this.load.image('blockstone', blockstone)




        // console.log('ProloadScene.preload')
    }
    create() {
        // console.log('PreloadScene.create')
        this.scene.start('Start')
    }
}