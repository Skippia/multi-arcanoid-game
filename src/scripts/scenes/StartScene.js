import config from '../../index'
import Client from '../classes/Client'

let mode = { type: 'single' }

class StartScene extends Phaser.Scene {
  constructor() {
    super('Start')
  }
  create() {
    console.log('StartScene.create')
    this.createBackground()
    // this.createText()
    this.createButtons()
    this.setEvents()
  }

  createBackground() {
    this.add.sprite(0, 0, 'bgSpace').setScale(1.75, 1.6).setOrigin(0, 0) // ???
  }
  createText() {
    this.add.text(config.width / 2, config.height / 2, `Click to start play!`,
      { fontSize: '65px', fill: '#fff' }).setOrigin(0.5)
  }
  setEvents() {
    // this.input.on('pointerdown', () => {
    //   this.scene.start('Game')
    // })

    this.button1.on('pointerdown', this.startSingleGame, this)
    this.button2.on('pointerdown', this.requestGame, this)
  }
  createButtons() {
    this.button1 = this.add.sprite(config.width / 2, config.height / 3 - 150 + 50, 'btnSingle').setOrigin(0, 0) // ???
      .setOrigin(0.5)
      .setInteractive()

    this.button2 = this.add.sprite(config.width / 2, config.height * 2 / 3 - 150, 'btnTwo').setOrigin(0, 0) // ???
      .setOrigin(0.5)
      .setInteractive()


  }
  startSingleGame() {
    mode.type = 'single'
    let obj = { client: undefined }
    this.scene.start('Game', obj)
  }
  startMultiGame() {
    mode.type = 'multi'
    console.log(this.client)

    let obj = { client: this.client }
    this.scene.start('Game', obj)
  }
  requestGame() {
    // инициализировать клиент
    this.client = new Client()
    // отправить запрос игры на сервер
    this.client.init()
    //  по факту получения противника  начать игру
    this.client.on('game', this.startMultiGame, this)
  }
}
export { StartScene, mode }