import config from '../../index'
import Phaser from "phaser"
import Map from '../classes/Map'
import Player from "../classes/Player"
import Ball from "../classes/Ball"

const PLATFORMS = {
    PLAYER_PLATFORM: {
        sprite: 'player',
        position: 'player'
    },
    ENEMY_PLATFORM: {
        sprite: 'enemy',
        position: 'enemy'
    }
}

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game')
        this.GAMES_STATES = { 'PREPARATION': 'PREPARATION', 'START': 'START', 'TRY': 'TRY', 'FINISH': 'FINISH' }
        this.gameState = this.GAMES_STATES['PREPARATION']
        // Game has not starting yet
        this.gameIsProcessing = false
        this.playerLife = 3

        this.angle = 0
        this.lastPortal = {}
        this.LAST_POSITION = {}
        this.timeStop = false
        this.firstPassT = true
        this.departurePortal = null
        this.arrivalPortal = null
        this.sceneRotated = false
        this.HP_ARRAY = []
        this.isCountdownComplete = false

    }
    init(data) {
        if (data.client) {
            this.client = data.client
        }
        this.cursors = this.input.keyboard.createCursorKeys()
    }
    preload() {
        this.add.sprite(0, 0, 'bg').setOrigin(0)
    }
    getPlatformsConfig() {
        // конфиг 1го игрока
        let config = { player: PLATFORMS.PLAYER_PLATFORM, enemy: PLATFORMS.ENEMY_PLATFORM }
        if (this.client && !this.client.master) {
            // конфиг 2го игрока
            config = { player: PLATFORMS.ENEMY_PLATFORM, enemy: PLATFORMS.PLAYER_PLATFORM }
        }
        return config
    }
    create() {
        this.cameras.main.setBounds(0, 0, 1024, 1024)
        this.cursors = this.input.keyboard.createCursorKeys()
        this.cameras.main.centerToBounds()

        this.matter.world.setBounds().disableGravity()
        const platform = this.getPlatformsConfig()
        this.map = new Map(this)
        this.ball = new Ball(this, this.map)
        this.player = new Player(this, this.map, platform.player)
        this.player.ball = this.ball.ball

        if (this.client) {
            this.enemy = new Player(this, this.map, platform.enemy)
            this.client.on('data', data => {
                this.enemy.player.setX(data.x)
                this.enemy.player.setY(data.y)
            })
            this.client.on('dataBall', ball => {
                this.ball.ball.setX(ball.x)
                this.ball.ball.setY(ball.y)
            })
        }

        this.initLabels()
        // this.setNickname()
        this.ball.ball.on('restart', this.onRestart, this)


        this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
            if (bodyB.gameObject && bodyB.gameObject.frame && bodyB.gameObject.frame.texture && bodyB.gameObject.frame.texture.firstFrame == 'ball'
                &&
                bodyA.gameObject && bodyA.gameObject.frame && bodyA.gameObject.frame.name == 'ball') {
                // console.log('Столкновение!')
            }



            if (bodyB.gameObject && bodyB.gameObject.frame && bodyB.gameObject.frame.texture && bodyB.gameObject.frame.texture.firstFrame == 'ball'
                &&
                bodyA.gameObject && bodyA.gameObject.frame && bodyA.gameObject.frame.name) {
                let ball = bodyB.gameObject.frame.texture.firstFrame
                let potentialPortal = bodyA.gameObject.frame.name



                if (ball == 'ball' & potentialPortal.startsWith('portal')) {
                    this.lastPortal = bodyA
                    let opposePortal = this.findOpposePortal(potentialPortal)
                    if (this.departurePortal != opposePortal && this.arrivalPortal != potentialPortal) {

                        this.departurePortal = potentialPortal
                        this.arrivalPortal = opposePortal
                        // console.log('FROM: ', this.departurePortal)
                        // console.log('TO: ', this.arrivalPortal)

                        let fromP = this.map.getPortalPosition(this.departurePortal)
                        let toP = this.map.getPortalPosition(this.arrivalPortal = opposePortal)

                        // console.log('FROM x,y : ', fromP.x, fromP.y)
                        // console.log('TO x,y : ', toP.x, toP.y)

                        this.ball.ball.setVisible(false)

                        this.LAST_POSITION.x = toP.x + 80
                        this.LAST_POSITION.y = toP.y - 80
                        this.timeStop = true

                        setTimeout(() => {
                            this.timeStop = false
                            this.ball.ball.setVisible(true)
                            // this.ball.ball.x = toP.x
                            // this.ball.ball.y = toP.y
                        }, 200)

                    }

                }


            }
        })

        var cam = this.cameras.main

        if (this.client && !this.client.master && !this.sceneRotated) {
            this.sceneRotated = true
            cam.rotation = Math.PI
            this.hp1.setAngle(180)
            this.hp2.setAngle(180)
            this.hp3.setAngle(180)
        }

        this.startCountdown()

    }

    update() {

        if (this.gameIsProcessing) {
            this.ball.adjuctSpeedBall()
        }


        // this.sync()



        if (this.lastPortal && this.lastPortal.gameObject) {
            if (this.gameIsProcessing) {
                this.angle += 9
                this.lastPortal.gameObject.setAngle(this.angle)
            }

        }


        if (this.timeStop == true) {
            // if (this.firstPassT) {
            // this.LAST_POSITION = { x: this.ball.ball.x, y: this.ball.ball.y }
            // console.log(this.LAST_POSITION)

            // this.firstPassT = false
            // }
            this.ball.ball.x = this.LAST_POSITION.x
            this.ball.ball.y = this.LAST_POSITION.y
        }

        this.player.move()
        this.ball.move()

    }
    sync() {
        if (this.client) {
            let ball = null
            if (this.client.master) {
                ball = this.player.ball
            }
            this.client.send({
                x: this.player.player.x,
                y: this.player.player.y,
                // xB: this.ball.ball.x,
                // yB: this.ball.ball.y,
            }, ball)
        }
    }
    initLabels() {
        if (this.client && !this.client.master && !this.sceneRotated) {
            this.hp1 = this.add.sprite(config.width - 15, config.height - 35, 'HP').setOrigin(0, 0)
            this.hp2 = this.add.sprite(config.width - 65, config.height - 35, 'HP').setOrigin(0, 0)
            this.hp3 = this.add.sprite(config.width - 115, config.height - 35, 'HP').setOrigin(0, 0)
        }
        else {
            this.hp1 = this.add.sprite(15, 35, 'HP').setOrigin(0, 0) // ???
            this.hp2 = this.add.sprite(65, 35, 'HP').setOrigin(0, 0) // ???
            this.hp3 = this.add.sprite(115, 35, 'HP').setOrigin(0, 0) // ???
        }
        this.HP_ARRAY.push(this.hp1, this.hp2, this.hp3)

        // this.lifesText = this.add.text(15, 15, `Lifes: ${this.playerLife}`, { fontSize: '46px', fill: '#000' })
        // this.mainText = this.add.text(config.width / 2, config.height / 6, `Ready ? >>> Click !`, { fontSize: '75px', fill: '#000' }).setOrigin(0.5)
    }
    startCountdown() {
        this.gameIsProcessing = false

        let time3 = this.add.sprite(config.width / 2, config.height / 2, 'time3')
        setTimeout(() => {
            time3.destroy()
            let time2 = this.add.sprite(config.width / 2, config.height / 2, 'time2')
            setTimeout(() => {
                time2.destroy()
                let time1 = this.add.sprite(config.width / 2, config.height / 2, 'time1')
                setTimeout(() => {
                    time1.destroy()
                    this.isCountdownComplete = true
                    this.checkIsPreparationGame()
                }, 1000)
            }, 1000)
        }, 1000)
    }
    checkIsPreparationGame() {
        // this.input.on('pointerdown', () => {
        // Если игра еще не началась и мы ожидаем кликов от обеих игроков и запускаем игру
        if (this.gameState == 'PREPARATION' && this.isCountdownComplete) {
            this.angle = 0
            this.lastPortal = {}
            this.gameState = this.GAMES_STATES['START']
            console.log('Game is starting right now!')
            this.startGame()
        }
        console.log(this.gameState)
        console.log(this.gameIsProcessing)

        // Игра запускается только один раз - когда флаг gameIsProcessing = false
        if (this.gameState == 'START' && !this.gameIsProcessing) {
            this.startGame()
        }
        // })
    }
    startGame() {
        // Задаем рандомную скорость и направление полета мяча из стартовой позции в центре экрана
        let randomSpectrum = [-1, 1]
        let speedX = randomSpectrum[Math.round(Math.random())] * (5 + Math.random() * this.ball.SPEED_HORIZONTAL)
        let speedY = randomSpectrum[Math.round(Math.random())] * (5 + Math.random() * this.ball.SPEED_VERTICAL)
        this.ball.ball.setVelocity(speedX, speedY)
        // Скрываем надпись "Click to play!"
        this.mainText.setVisible(false)

        // Начинаем игровой процесс
        this.gameState = this.GAMES_STATES['START']
        this.gameIsProcessing = true
    }

    onRestart() {
        this.scene.start('Finish')
    }
    findOpposePortal(name) {
        if (name.split('').includes('2')) {
            if (name.endsWith('start')) {
                return 'portal2-end'
            } else {
                return 'portal2-start'
            }
        } else {
            if (name.endsWith('start')) {
                return 'portal3-end'
            } else {
                return 'portal3-start'
            }
        }
    }

}