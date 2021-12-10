import config from '../../index'

export default class Ball {
  constructor(scene, map) {
    this.DIRECTIONS_HORIZONTAL = Object.freeze({ BACKWARD: -1, NONE: 0, FORWARD: 1 })
    this.SPEED_HORIZONTAL = 10
    this.DIRECTIONS_VERTICAL = Object.freeze({ BACKWARD: -1, NONE: 0, FORWARD: 1 })
    this.SPEED_VERTICAL = 10
    this.scene = scene
    this.map = map

    this.ball = this.scene.matter.add.sprite(config.width / 2, config.height / 2, 'objects', 'ball')
    this.ball.setIgnoreGravity(true)
    this.ball.setBounce(1)
    this.ball.setFriction(0, 0, 0)
    // this.ball.setVelocity(0, 0)
    // this.ball.setFixedRotation()
    // this.ball.setAngle(0)
    // this.ball.setFrictionAir(0)
  }
  created() {

  }
  move() {
    this.checkPosition()
  }
  checkPosition() {
    const checkpoint = this.map.getCheckpoint(this.ball)
    if (checkpoint) {
      this.onCheckpoint(checkpoint)
    }
  }
  onCheckpoint(checkpoint) {
    // Если мяч пересек нижнюю границу - значит игрок проиграл
    if (checkpoint == 'bottom') {

      // Если это не последняя жизнь, то просто начинаем попытку заново
      if (this.scene.playerLife > 0) {
        // Фиксируем мяч в пространстве
        this.ball.x = config.width / 2
        this.ball.y = config.height / 2
        this.ball.setVelocity(0, 0)
        // Уменьшаем кол-во ХП игрока и перерисовываем надпись
        this.scene.playerLife--
        this.scene.lifesText.setText(`Lifes : ${this.scene.playerLife}`)
        // Переходим в режим подготовки к бою
        this.scene.gameState = this.scene.GAMES_STATES['PREPARATION']
        this.scene.gameIsProcessing = false
        // Показываем надпись
        this.scene.mainText.setVisible(true)
      } else {
        console.log('Game over!')
        // Инициируем события рестарта, которое будет прослушивать GameScene
        this.ball.emit('restart', 'restart')
        // Сбрасываем показатели жизни до исходных и останавливаем игровой процесс
        this.scene.playerLife = 3
        this.scene.gameIsProcessing = false
      }
    }

  }
}
