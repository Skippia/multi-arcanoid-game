import Phaser from "phaser"
import bgPng from '../../assets/bg.png'

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot')
    }
    preload() {
        console.log('BootScene.preload')
        this.load.image('bg', bgPng)
    }
    create() {
        console.log('BootScene.create')
        this.scene.start('Preload')
    }
}