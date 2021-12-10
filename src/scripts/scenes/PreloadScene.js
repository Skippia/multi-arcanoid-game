import Phaser from "phaser"
// import LoadingBar from '../classes/LoadingBar'
// import tilesetPng from '../../assets/tileset.png';
import tilemapJson from '../../assets/tilemap.json'
import objectsPng from '../../assets/objects.png'
import bgSpace from '../../assets/bg-space.png'
import objectsJson from '../../assets/objects.json'
// import particularPng from '../../assets/particular.png'
// import particularJson from '../../assets/particular.json'
import ball from '../../assets/ball.png'
import bgFinish from '../../assets/finish.png'
import btnSingle from '../../assets/btn-single.png'
import btnTwo from '../../assets/btn-two.png'

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload')
    }
    preload() {
        // this.add.sprite(0, 0, 'bg').setOrigin(0)
        // this.loadingBar = new LoadingBar(this)

        this.load.image('bgSpace', bgSpace)
        this.load.image('bgFinish', bgFinish)
        this.load.tilemapTiledJSON('tilemap', tilemapJson)
        this.load.atlas('objects', objectsPng, objectsJson)
        this.load.image('ball', ball)
        this.load.image('btnSingle', btnSingle)
        this.load.image('btnTwo', btnTwo)
        // this.load.atlas('space', particularPng, particularJson)

        console.log('ProloadScene.preload')
    }
    create() {
        console.log('PreloadScene.create')
        this.scene.start('Start')
    }
}