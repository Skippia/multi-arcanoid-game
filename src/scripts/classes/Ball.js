import config from '../../index'

export default class Ball {
  constructor(scene, map) {
    this.DIRECTIONS_HORIZONTAL = Object.freeze({ BACKWARD: -1, NONE: 0, FORWARD: 1 })
    this.SPEED_HORIZONTAL = 15
    this.DIRECTIONS_VERTICAL = Object.freeze({ BACKWARD: -1, NONE: 0, FORWARD: 1 })
    this.SPEED_VERTICAL = 15
    this.scene = scene
    this.map = map

    this.playerCheckpointFirstEntrance = true
    this.enemyCheckpointFirstEntrance = true

    this.ball = this.scene.matter.add.sprite(config.width / 2, config.height / 2, 'objects', 'ball')

    this.ball.setIgnoreGravity(true)
    this.ball.setBounce(1)
    this.ball.setFriction(0, 0, 0)

  }
  created() {

  }
  adjuctSpeedBall() {
    const { x, y } = this.ball.body.velocity
    let signX = x / Math.abs(x)
    let signY = y / Math.abs(y)

    if (Math.abs(x) >= this.SPEED_HORIZONTAL) {
      this.ball.setVelocityX(this.SPEED_HORIZONTAL * signX)
    } else if (Math.abs(x) <= this.SPEED_HORIZONTAL / 2) {
      this.ball.setVelocityX(this.SPEED_HORIZONTAL / 2 * signX)
    }

    if (Math.abs(y) >= this.SPEED_VERTICAL) {
      this.ball.setVelocityY(this.SPEED_VERTICAL * signY)
    } else if (Math.abs(y) <= this.SPEED_VERTICAL / 2) {
      this.ball.setVelocityY(this.SPEED_VERTICAL / 2 * signY)
    }

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
    if (checkpoint == 'bottom' && this.playerCheckpointFirstEntrance) {
      this.playerCheckpointFirstEntrance = false

      // Если это не последняя жизнь, то просто начинаем попытку заново
      if (this.scene.playerHP > 0) {
        console.log('BOTTOM LOSE')
        this.scene.isBugBottom = false
        // Фиксируем мяч в пространстве
        this.ball.x = config.width / 2
        this.ball.y = config.height / 2
        this.ball.setVelocity(0, 0)

        // Сбрасываем счетчик первого захода в зону проигрыша для игрока player
        this.playerCheckpointFirstEntrance = true
        // Сообщаем slave что игрок потерял жизнь

        console.log('call player lose')

        this.scene.events.emit('playerLose')

      } else {
        console.log('Game over!')
        // Сообщаем slave что игрок проиграл
        this.scene.events.emit('playerLostSayToSlave')
        this.playerCheckpointFirstEntrance = true
        // Инициируем события рестарта, которое будет прослушивать GameScene
        this.scene.globalRestart()
      }
    }

    else if (checkpoint == 'top' && this.enemyCheckpointFirstEntrance && 1 < 0) {
      this.enemyCheckpointFirstEntrance = false

      // Если это не последняя жизнь, то просто начинаем попытку заново
      if (this.scene.enemyHP > 0) {
        console.log('TOP LOSE')
        this.scene.isBugTop = false

        // Фиксируем мяч в пространстве
        this.ball.x = config.width / 2
        this.ball.y = config.height / 2
        this.ball.setVelocity(0, 0)

        // Сбрасываем счетчик первого захода в зону проигрыша для игрока player
        this.enemyCheckpointFirstEntrance = true
        // Сообщаем slave что игрок потерял жизнь

        console.log('call player lose')

        this.scene.events.emit('enemyLose')

      } else {
        console.log('Game over!')
        // Сообщаем slave что игрок проиграл
        this.scene.events.emit('enemyLostSayToSlave')
        this.enemyCheckpointFirstEntrance = true
        // Инициируем события рестарта, которое будет прослушивать GameScene
        this.scene.globalRestart()
      }
    }

  }
}
