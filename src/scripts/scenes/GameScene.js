import config from '../../index'
import Phaser from "phaser"
import Map from '../classes/Map'
import Player from "../classes/Player"
import Ball from "../classes/Ball"
import { mode } from './StartScene'
import Util from '../classes/Utils'



export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game')
        this.GAMES_STATES = { 'PREPARATION': 'PREPARATION', 'START': 'START', 'TRY': 'TRY', 'FINISH': 'FINISH' }
        this.PLATFORMS = {
            PLAYER_PLATFORM: {
                sprite: 'player',
                position: 'player'
            },
            ENEMY_PLATFORM: {
                sprite: 'enemy',
                position: 'enemy'
            }
        }
    }
    // hook receive args from scene call
    init(obj) {
        // Если объект содержит клиента, значит мы сохраняем его в GameScene.client поле
        if (obj.client) {
            this.client = obj.client
        }
        // Инициализируем событие клавиш
        this.cursors = this.input.keyboard.createCursorKeys()
    }
    preload() {
        this.add.sprite(0, 0, 'bg').setOrigin(0)
    }
    getPlatformsConfig() {
        // конфиг 1го игрока
        let config = { player: this.PLATFORMS.PLAYER_PLATFORM, enemy: this.PLATFORMS.ENEMY_PLATFORM }

        if (mode.type == 'single') {
            return config
        }

        if (this.client && !this.client.master) {
            // конфиг 2го игрока
            config = { player: this.PLATFORMS.ENEMY_PLATFORM, enemy: this.PLATFORMS.PLAYER_PLATFORM }
        }
        return config
    }
    create() {
        console.log('hello to game scene')
        console.log('Mode is : ', mode)

        // Pass here
        // Game has not starting yet
        this.gameState = this.GAMES_STATES['PREPARATION']
        this.gameIsProcessing = false
        this.playerHP = 3
        this.enemyHP = 3
        this.angle = 0
        this.lastPortal = {}
        this.LAST_POSITION = {}
        this.timeStop = false
        this.firstPassT = true
        this.departurePortal = null
        this.arrivalPortal = null
        this.sceneRotated = false
        this.PLAYER_HP_ARRAY = []
        this.ENEMY_HP_ARRAY = []
        this.isCountdownComplete = false

        this.isBugBottom = false
        this.isBugTop = false
        this.depth = {
            floor: 0,
            player: 1,
            UI: 2
        }
        // Controls
        this.is_holding = {
            left: false,
            right: false,
            direction: false,
        }
        this.cameras.main.setBounds(0, 0, 1024, 1024)
        this.cursors = this.input.keyboard.createCursorKeys()
        this.cameras.main.centerToBounds()
        this.matter.world.setBounds().disableGravity()
        const platform = this.getPlatformsConfig()
        this.map = new Map(this)
        this.ball = new Ball(this, this.map)
        this.player = new Player(this, this.map, platform.player)
        this.player.ball = this.ball.ball

        if (this.client && mode.type == 'multi') {
            console.log('Multi player is active')
            this.enemy = new Player(this, this.map, platform.enemy)
            this.client.on('data', data => {
                this.enemy.player.setX(data.x)
                this.enemy.player.setY(data.y)
            })
            this.client.on('dataBall', ball => {
                this.ball.ball.setX(ball.x)
                this.ball.ball.setY(ball.y)
            })

            this.client.on('playerHP', playerHP => {
                // Если игра еще не была перезапущена, то начинаем ее перезапуск и выключаем этот флаг
                this.playerHP = playerHP
                console.log('New playerHP: ', this.playerHP)
                if (this.playerHP >= 0) {
                    this.reloadSublevelPlayerHelp()
                } else {
                    // Игрок проиграл (рестарт для slave)
                    this.globalRestart('playerLost')
                }
            })
            this.client.on('enemyHP', enemyHP => {

                this.enemyHP = enemyHP
                console.log('New enemyHP: ', this.enemyHP)
                if (this.enemyHP >= 0) {
                    this.reloadSublevelEnemyHelp()
                } else {
                    // Враг проиграл (рестарт для slave)
                    // Начинаем перезапуск игры
                    this.globalRestart('enemyLost')
                }

            })

        }

        this.initLabels()
        this.events.on('restart', this.onRestart, this)


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

        if (this.client && !this.client.master && !this.sceneRotated && mode.type == 'multi') {
            console.log('Create controls for slave')
            this.createControlsSlave()

            this.sceneRotated = true
            cam.rotation = Math.PI
            this.hpPlayer1.setAngle(180)
            this.hpPlayer2.setAngle(180)
            this.hpPlayer3.setAngle(180)

            this.hpEnemy1.setAngle(180)
            this.hpEnemy2.setAngle(180)
            this.hpEnemy3.setAngle(180)
        } else {
            console.log('Create controls for host')
            this.createControlsHost()
        }

        this.events.on('playerLose', this.reloadSublevelPlayer, this)
        this.events.on('playerLostSayToSlave', this.playerLostSayToSlave, this)
        this.events.on('enemyLose', this.reloadSublevelEnemy, this)
        this.events.on('enemyLostSayToSlave', this.enemyLostSayToSlave, this)
        this.startCountdown()
    }
    removePlayerOneHP() {
        // Удаляем одну жизнь
        console.log('delete player hp')
        if (this.PLAYER_HP_ARRAY.length > 0) {
            this.PLAYER_HP_ARRAY.pop().destroy()
        }
    }
    removeEnemyOneHP() {
        // Удаляем одну жизнь

        console.log('delete enemy hp')
        this.ENEMY_HP_ARRAY.pop().destroy()
    }
    reloadSublevelPlayer() {
        if (!this.isBugBottom) {
            this.isBugBottom = true
            // Уменьшаем кол-во ХП игрока на хосте
            this.playerHP--
            console.log(this.playerHP)

            // Отправляем информацию о хп на зависимый хост, если это мультиплеер
            if (mode.type == 'multi') {
                this.client.sendPlayerHP(this.playerHP)
            }
            this.reloadSublevelPlayerHelp()
        }
    }

    reloadSublevelEnemy() {
        if (!this.isBugTop) {
            this.isBugTop = true
            // Уменьшаем кол-во ХП игрока на хосте
            this.enemyHP--
            console.log(this.enemyHP)

            // Отправляем информацию о хп на зависимый хост
            this.client.sendEnemyHP(this.enemyHP)
            this.reloadSublevelEnemyHelp()
        }
    }

    playerLostSayToSlave() {
        if (mode.type == 'multi') {
            this.client.sendPlayerHP(this.playerHP - 1)
        } else {
            this.globalRestart('playerLost')
        }
    }

    enemyLostSayToSlave() {
        this.client.sendEnemyHP(this.enemyHP - 1)
    }

    reloadSublevelPlayerHelp() {
        // Удаляем один спрайт
        this.removePlayerOneHP()
        // Обратный отсчет еще не завершен
        this.isCountdownComplete = false
        // Переходим в режим подготовки к бою
        this.gameState = this.GAMES_STATES['PREPARATION']
        // Начинаем обртаный отсчет

        this.startCountdown()
    }

    reloadSublevelEnemyHelp() {
        // Удаляем один спрайт
        this.removeEnemyOneHP()
        // Обратный отсчет еще не завершен
        this.isCountdownComplete = false
        // Переходим в режим подготовки к бою
        this.gameState = this.GAMES_STATES['PREPARATION']
        // Начинаем обртаный отсчет

        this.startCountdown()
    }
    update() {

        if (this.client && this.client.master || mode.type == 'single') {
            // Регулирует скорость мяча только хост
            if (this.gameIsProcessing) {
                this.ball.adjuctSpeedBall()
            }
            // Положение мяча и чекпоинты отслеживает только хост
            this.ball.checkBallPosition()

            if (this.timeStop == true) {

                /* if (this.firstPassT) {
                this.LAST_POSITION = { x: this.ball.ball.x, y: this.ball.ball.y }
                console.log(this.LAST_POSITION)

                this.firstPassT = false
                } */
                this.ball.ball.x = this.LAST_POSITION.x
                this.ball.ball.y = this.LAST_POSITION.y
            }

        }


        // Порталы отслеживает каждый клиент
        if (this.lastPortal && this.lastPortal.gameObject) {
            if (this.gameIsProcessing) {
                this.angle += 9
                this.lastPortal.gameObject.setAngle(this.angle)
            }

        }

        // Положение платформ отслеживается обоими клиентами
        this.player.move()

        if (mode.type == 'multi') {
            this.sync()
        }
    }
    sync() {
        // Синхронизирование движения происходит только в режиме мультиплеер

        let ball = null
        if (this.client.master) {
            ball = this.player.ball
        }
        setTimeout(() => {
            if (this.client && this.client.send) {
                this.client.send({
                    x: this.player.player.x,
                    y: this.player.player.y,
                    // xB: this.ball.ball.x,
                    // yB: this.ball.ball.y,
                }, ball)
            }
        }, 0)

    }
    initLabels() {
        if (mode.type == 'multi') {
            if (this.client && !this.client.master && !this.sceneRotated) {
                // Slave
                // Player hp
                this.hpPlayer1 = this.add.sprite(config.width - 15, config.height - 35, 'HPEnemy').setOrigin(0)
                this.hpPlayer2 = this.add.sprite(config.width - 65, config.height - 35, 'HPEnemy').setOrigin(0)
                this.hpPlayer3 = this.add.sprite(config.width - 115, config.height - 35, 'HPEnemy').setOrigin(0)
                // Enemy hp
                this.hpEnemy1 = this.add.sprite(config.width - 15, config.height - 100, 'HP').setOrigin(0)
                this.hpEnemy2 = this.add.sprite(config.width - 65, config.height - 100, 'HP').setOrigin(0)
                this.hpEnemy3 = this.add.sprite(config.width - 115, config.height - 100, 'HP').setOrigin(0)
            }
            else {
                // Master
                // Player hp
                this.hpPlayer1 = this.add.sprite(15, 100, 'HP').setOrigin(0)
                this.hpPlayer2 = this.add.sprite(65, 100, 'HP').setOrigin(0)
                this.hpPlayer3 = this.add.sprite(115, 100, 'HP').setOrigin(0)
                // Enemy hp
                this.hpEnemy1 = this.add.sprite(15, 35, 'HPEnemy').setOrigin(0)
                this.hpEnemy2 = this.add.sprite(65, 35, 'HPEnemy').setOrigin(0)
                this.hpEnemy3 = this.add.sprite(115, 35, 'HPEnemy').setOrigin(0)
            }
            this.PLAYER_HP_ARRAY.push(this.hpPlayer1, this.hpPlayer2, this.hpPlayer3)
            this.ENEMY_HP_ARRAY.push(this.hpEnemy1, this.hpEnemy2, this.hpEnemy3)

        } else if (mode.type == 'single') {
            this.hpPlayer1 = this.add.sprite(15, 100, 'HP').setOrigin(0)
            this.hpPlayer2 = this.add.sprite(65, 100, 'HP').setOrigin(0)
            this.hpPlayer3 = this.add.sprite(115, 100, 'HP').setOrigin(0)
            this.PLAYER_HP_ARRAY.push(this.hpPlayer1, this.hpPlayer2, this.hpPlayer3)
        }

    }
    startCountdown() {
        this.gameIsProcessing = false
        let time3 = this.add.sprite(config.width / 2, config.height / 2, 'time3')
        if (this.client && !this.client.master && mode.type == 'multi') {
            time3.setAngle(180)
        }
        setTimeout(() => {
            time3.destroy()
            let time2 = this.add.sprite(config.width / 2, config.height / 2, 'time2')
            if (this.client && !this.client.master && mode.type == 'multi') {
                time2.setAngle(180)
            }
            setTimeout(() => {
                time2.destroy()
                let time1 = this.add.sprite(config.width / 2, config.height / 2, 'time1')
                if (this.client && !this.client.master && mode.type == 'multi') {
                    time1.setAngle(180)
                }
                setTimeout(() => {
                    time1.destroy()
                    this.isCountdownComplete = true
                    this.checkIsPreparationGame()
                }, 1000)
            }, 1000)
        }, 1000)
    }
    checkIsPreparationGame() {
        if (this.gameState == 'PREPARATION' && this.isCountdownComplete) {
            this.angle = 0
            this.lastPortal = {}
            this.gameState = this.GAMES_STATES['START']
            this.startGame()
        }

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

        // Начинаем игровой процесс
        this.gameState = this.GAMES_STATES['START']
        this.gameIsProcessing = true
    }

    onRestart(conditionGame) {
        console.log('GO to finish')

        if (mode.type == 'multi') {
            // Закрываем серверный сокет
            // this.client.closeServerSocket()
            // Закрываем клиентский сокет
            this.client.socket.close()
            setTimeout(() => {
                this.client = {}
            }, 50)
        }



        // Игра была успешно перезапущена, поэтому теперь ее вновь можно будет перезапустить в будущем
        if (conditionGame == 'win') {
            this.scene.start('WinFinish')
        } else if (conditionGame == 'lost') {
            this.scene.start('LostFinish')
        }

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
    globalRestart(looser) {
        console.log('In this game is looser : ', looser)
        let config = null
        let configScreen = [{ 'master': 'win', 'slave': 'lost' }, { 'master': 'lost', 'slave': 'win' }]

        if (mode.type == 'multi') {
            if (looser == 'playerLost' && this.client && this.client.master) {
                // Это хост и он проиграл
                console.log('You (host) has lost!')
                this.events.emit('restart', 'lost')
            } else if (looser == 'playerLost' && this.client && !this.client.master) {
                // Это slave и он выиграл
                console.log('You (slave) has win!')
                this.events.emit('restart', 'win')
            } else if (looser == 'enemyLost' && this.client && this.client.master) {
                // Это хост и он выиграл
                console.log('You (host) has win!')
                this.events.emit('restart', 'win')
            } else if (looser == 'enemyLost' && this.client && !this.client.master) {
                // Это slave  и он проиграл
                console.log('You (slave) has lost!')
                this.events.emit('restart', 'lost')
            }
        } else {
            this.events.emit('restart', 'lost')
        }

        // Сбрасываем показатели жизни до исходных и останавливаем игровой процесс
        this.playerHP = 3
        this.enemyHP = 3
        this.gameIsProcessing = false
    }

    // Controls....................
    createControlsHost() {
        // Create zones for input
        let w = config.width
        let h = config.height

        this.zone_left = this.add.zone(150, h - 120, 160, 160)
        this.zone_left.setDepth(this.depth.UI)
        this.zone_left.setScrollFactor(0)

        this.zone_right = this.add.zone(w - 150, h - 120, 160, 160)
        this.zone_right.setDepth(this.depth.UI)
        this.zone_right.setScrollFactor(0)

        let debug = this.add.graphics({ x: 0, y: 0 })
        debug.fillStyle('0x000000', 0.5)
        // debug.fillRect(0, 0, w * 0.9, h * 2)
        debug.fillCircleShape({ x: 150, y: h - 120, radius: 80 })
        debug.setScrollFactor(0)
        debug.setDepth(this.depth.UI)

        let debug2 = this.add.graphics({ x: 0, y: 0 })
        debug2.fillStyle('0x000000', 0.5)
        // debug.fillRect(0, 0, w * 0.9, h * 2)
        debug2.fillCircleShape({ x: w - 150, y: h - 120, radius: 80 })
        debug2.setScrollFactor(0)
        debug2.setDepth(this.depth.UI)


        // Add input callback
        this.zone_left.setInteractive()
        this.zone_left.on('pointerdown', this.holdLeft, this)
        this.zone_left.on('pointerup', this.releaseLeft, this)
        this.zone_left.on('pointerout', this.releaseLeft, this)

        this.zone_right.setInteractive()
        this.zone_right.on('pointerdown', this.holdRight, this)
        this.zone_right.on('pointerup', this.releaseRight, this)
        this.zone_right.on('pointerout', this.releaseRight, this)
    }
    createControlsSlave() {
        // Create zones for input
        let w = config.width
        let h = config.height

        this.zone_left = this.add.zone(w - 150, 120, 160, 160)
        this.zone_left.setDepth(this.depth.UI)
        this.zone_left.setScrollFactor(0)

        this.zone_right = this.add.zone(150, 120, 160, 160)
        this.zone_right.setDepth(this.depth.UI)
        this.zone_right.setScrollFactor(0)

        let debug = this.add.graphics({ x: 0, y: 0 })
        debug.fillStyle('0x000000', 0.5)
        // debug.fillRect(0, 0, w * 0.9, h * 2)
        debug.fillCircleShape({ x: 150, y: 120, radius: 80 })
        debug.setScrollFactor(0)
        debug.setDepth(this.depth.UI)

        let debug2 = this.add.graphics({ x: 0, y: 0 })
        debug2.fillStyle('0x000000', 0.5)
        // debug.fillRect(0, 0, w * 0.9, h * 2)
        debug2.fillCircleShape({ x: w - 150, y: 120, radius: 80 })
        debug2.setScrollFactor(0)
        debug2.setDepth(this.depth.UI)


        // Add input callback
        this.zone_left.setInteractive()
        this.zone_left.on('pointerdown', this.holdLeft, this)
        this.zone_left.on('pointerup', this.releaseLeft, this)
        this.zone_left.on('pointerout', this.releaseLeft, this)

        this.zone_right.setInteractive()
        this.zone_right.on('pointerdown', this.holdRight, this)
        this.zone_right.on('pointerup', this.releaseRight, this)
        this.zone_right.on('pointerout', this.releaseRight, this)
    }


    holdLeft() {
        this.is_holding.left = true
        this.is_holding.direction = 'left'
    }

    holdRight() {

        this.is_holding.right = true
        this.is_holding.direction = 'right'
    }

    releaseLeft() {
        console.log('left')

        this.is_holding.left = false
        if (this.is_holding.right) {
            this.is_holding.direction = 'right'
        } else {
            this.is_holding.direction = false
        }
    }

    releaseRight() {
        console.log('right')

        this.is_holding.right = false
        if (this.is_holding.left) {
            this.is_holding.direction = 'left'
        } else {
            this.is_holding.direction = false
        }
    }


}