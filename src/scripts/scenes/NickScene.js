import config from "../../index"
import Phaser from "phaser"

export default class NickScene extends Phaser.Scene {
  constructor() {
    super('Nick')
  }
  preload() {
  }

  create() {
    console.log('NickScene.create')
    this.createBtnReturn()


  }
  backToMenu() {
    this.scene.start('Start')
  }
  createBtnReturn() {
    this.add.sprite(0, 0, 'nickBg').setOrigin(0, 0) // ???
    this.btnReturn = this.add.sprite(config.width / 2, 150, 'btnReturn').setOrigin(0.5).setInteractive()
    this.btnReturn.on('pointerdown', this.backToMenu, this)
  }


}