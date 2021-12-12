import Phaser from "phaser"
import tilemapJson from '../../assets/tilemap.json'
import objectsPng from '../../assets/objects.png'
import bgSpace from '../../assets/bg-space.png'
import objectsJson from '../../assets/objects.json'
import ball from '../../assets/ball.png'
import bgFinish from '../../assets/finish.png'
import btnSingle from '../../assets/btn-single.png'
import btnTwo from '../../assets/btn-two.png'
import btnChangeNick from '../../assets/change-nick.png'
import nickBg from '../../assets/changeBg.jpg'
import btnReturn from '../../assets/btnReturn.png'
import HP from '../../assets/full-hp.png'
import time3 from '../../assets/time3.png'
import time2 from '../../assets/time2.png'
import time1 from '../../assets/time1.png'



export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload')
    }
    preload() {
        this.load.image('bgSpace', bgSpace)
        this.load.image('bgFinish', bgFinish)
        this.load.tilemapTiledJSON('tilemap', tilemapJson)
        this.load.atlas('objects', objectsPng, objectsJson)
        this.load.image('ball', ball)
        this.load.image('btnSingle', btnSingle)
        this.load.image('btnTwo', btnTwo)
        this.load.image('btnChangeNick', btnChangeNick)
        this.load.image('nickBg', nickBg)
        this.load.image('btnReturn', btnReturn)
        this.load.image('HP', HP)
        this.load.image('time3', time3)
        this.load.image('time2', time2)
        this.load.image('time1', time1)




        // console.log('ProloadScene.preload')
    }
    create() {
        // console.log('PreloadScene.create')
        this.scene.start('Start')
    }
}