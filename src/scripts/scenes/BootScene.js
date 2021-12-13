import Phaser from "phaser"
import bgPng from '../../assets/bg.png'

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot')
    }
    preload() {
        // console.log('BootScene.preload')
        this.load.image('bg', bgPng)

    }
    create() {
        // console.log('BootScene.create')
        this.add.sprite(0, 0, 'bgSpace').setScale(1.75, 1.6).setOrigin(0, 0) // ???
        this.scene.start('Preload')
    }
}