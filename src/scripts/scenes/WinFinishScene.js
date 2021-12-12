import config from '../../index'

export default class WinFinishScene extends Phaser.Scene {
  constructor() {
    super('WinFinish')
  }
  create() {
    this.createBackgroundFinish()
    this.createText()
    this.setEvents()
  }

  createBackgroundFinish() {
    this.add.sprite(0, 0, 'bgFinishWin').setOrigin(0, -0.1) // ???
  }
  createText() {
    this.add.text(config.width / 2, config.height / 4, `Click to restart!`,
      { fontSize: '90px', fill: '#fff' }).setOrigin(0.5)
  }
  setEvents() {
    this.input.on('pointerdown', () => {
      this.scene.start('Start')
    })
  }
}
