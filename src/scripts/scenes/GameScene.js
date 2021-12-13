import config from '../../index'
import Phaser from "phaser"
import Map from '../classes/Map'
import Player from "../classes/Player"
import Ball from "../classes/Ball"
import { mode } from './StartScene'
import Util from '../classes/Utils'

let blocks = {}
let countOfBlocks = 0
let countOfDestroyed = 0
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
    setBaseConfig() {
        this.gameState = this.GAMES_STATES['PREPARATION']
        this.gameIsProcessing = false
        this.playerHP = 3
        this.enemyHP = 3
        this.angle = 0
        this.lastPortal = {}
        this.LAST_POSITION = {}
        this.LAST_VELOCITY = {}
        this.timeSkillBtnReady = true
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
        this.timeHasStoped = false

    }
    setPhysicsWorld() {
        this.matter.world.setBounds().disableGravity()

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

                        this.LAST_VELOCITY.x = this.ball.ball.body.velocity.x
                        this.LAST_VELOCITY.y = this.ball.ball.body.velocity.y

                        this.timeStop = true

                        setTimeout(() => {
                            this.timeStop = false
                            this.ball.ball.setVisible(true)
                            this.ball.ball.setVelocityX(this.LAST_VELOCITY.x)
                            this.ball.ball.setVelocityY(this.LAST_VELOCITY.y)
                            this.firstSetBallPosition = false
                            // this.ball.ball.x = toP.x
                            // this.ball.ball.y = toP.y
                        }, 200)

                    }

                }


            }
        })
    }
    setCameraRotationSettings() {
        this.cam = this.cameras.main
        this.cameras.main.setBounds(0, 0, 1024, 1024)
        this.cursors = this.input.keyboard.createCursorKeys()
        this.cameras.main.centerToBounds()

    }
    setTouchControls() {
        this.depth = {
            floor: 0,
            player: 1,
            UI: 2
        }

        this.is_holding = {
            left: false,
            right: false,
            direction: false,
        }
    }
    setKeyboardControls() {
    }
    createMap() {
        this.map = new Map(this)
    }
    createBall() {
        this.ball = new Ball(this, this.map)
    }
    createPlayer() {
        this.platform = this.getPlatformsConfig()
        this.player = new Player(this, this.map, this.platform.player)
        this.player.ball = this.ball.ball
    }
    setEvents() {
        this.events.on('restart', this.onRestart, this)
        this.events.on('playerLose', this.reloadSublevelPlayer, this)
        this.events.on('playerLostSayToSlave', this.playerLostSayToSlave, this)
        this.events.on('enemyLose', this.reloadSublevelEnemy, this)
        this.events.on('enemyLostSayToSlave', this.enemyLostSayToSlave, this)
    }
    setClientEvents() {
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
        this.client.on('sayHostToStopTime', () => {
            console.log('Need to stop time (msg from slave!!!!!!!!!!!!!!!!!!)')
            // Останавливаем время на хосте => и на slave
            this.stopTimeActivate()
        })

    }

    create() {
        console.log('hello to game scene')
        console.log('Mode is : ', mode)
        this.setBaseConfig()
        this.setCameraRotationSettings()
        this.setPhysicsWorld()
        this.setTouchControls()
        this.createMap()
        this.createBall()

        // Single mode initialization
        this.createPlayer()

        this.initLabels()
        this.setEvents()

        // Multi mode has actived
        if (this.client && mode.type == 'multi') {
            console.log('Multi mode has actived...')

            // Create enemy platform
            this.enemy = new Player(this, this.map, this.platform.enemy)
            // Set client events to share state objects
            this.setClientEvents()

        } else {
            this.generateBlocks()
            console.log('Single mode has actived...')
        }

        // Initialization controls touch + rotating slave screen
        if (this.client && !this.client.master && !this.sceneRotated && mode.type == 'multi') {
            console.log('Create controls for slave')
            this.createControlsSlave()

            this.sceneRotated = true
            this.cam.rotation = Math.PI
            this.hpPlayer1.setAngle(180)
            this.hpPlayer2.setAngle(180)
            this.hpPlayer3.setAngle(180)

            this.hpEnemy1.setAngle(180)
            this.hpEnemy2.setAngle(180)
            this.hpEnemy3.setAngle(180)
            this.timeDebug.setAngle(180)
        } else {
            console.log('Create controls for host | for single mode')
            this.createControlsHost()
        }

        // Start countdown of starting game
        this.startCountdown()
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
            // Регулирует скорость мяча только хост или single player

            // Если игра уже идет, регулируем скорость мяча
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
                // Velocity zero
                this.ball.ball.setVelocity(0)
                //xxx
                if (!this.firstSetBallPosition) {
                    this.ball.ball.x = this.LAST_POSITION.x
                    this.ball.ball.y = this.LAST_POSITION.y
                    this.firstSetBallPosition = true
                }

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

        // Если это режим мультиплеера, то синхронизируем состояния платформ и мяча
        if (mode.type == 'multi') {
            this.sync()
        }
    }
    sync() {
        // Синхронизирование движения происходит только в режиме мультиплеер
        let ball = null
        // Если это хост, то сохраняем координаты мяча
        if (this.client.master) {
            ball = this.player.ball
        }
        // setTimeout(() => {
        // Отрправляем информацию о платформах и о мяче
        if (this.client && this.client.send) {
            this.client.send({
                x: this.player.player.x,
                y: this.player.player.y,

            }, ball)
        }
        // }, 0)

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
            this.initStartGame()
        }

        // Игра запускается только один раз - когда флаг gameIsProcessing = false
        if (this.gameState == 'START' && !this.gameIsProcessing) {
            console.log('start game 420')

            this.initStartGame()
        }
    }
    initStartGame() {
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
            }, 150)
        }

        if (conditionGame == 'win') {
            this.scene.start('WinFinish')
        } else if (conditionGame == 'lost') {
            this.scene.start('LostFinish')
        }

    }
    globalRestart(looser) {
        console.log('In this game is looser : ', looser)

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
            blocks = {}
            countOfBlocks = 0
            countOfDestroyed = 0

            if (looser == 'all block destroyed') {
                this.events.emit('restart', 'win')
            } else {
                this.events.emit('restart', 'lost')
            }
        }

        // Сбрасываем показатели жизни до исходных и останавливаем игровой процесс
        this.playerHP = 3
        this.enemyHP = 3
        this.gameIsProcessing = false
    }
    initLabels() {
        if (mode.type == 'multi') {
            if (this.client && !this.client.master && !this.sceneRotated) {
                // Slave
                this.stopTimeSkillInitSlave()
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

                this.stopTimeSkillInitHost()
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
            this.stopTimeSkillInitHost()
            this.PLAYER_HP_ARRAY.push(this.hpPlayer1, this.hpPlayer2, this.hpPlayer3)
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

    // Generate blocs
    generateBlocks() {

        countOfBlocks = Math.floor(2 + Math.random() * 3) // 2 - 4
        console.log('Random: ', countOfBlocks)


        let sizeBlock = 128
        for (let i = 0; i < countOfBlocks; i++) {
            let block = this.matter.add.image((config.width / countOfBlocks + sizeBlock / 2) + i * sizeBlock + i * sizeBlock, 150, 'blockstone', null, { isStatic: true }).setOrigin(0.5)
            block.name = `block${i}`
            blocks[`block${i}`] = block
        }

        this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
            if (mode.type == 'single') {
                if (bodyB.gameObject && bodyB.gameObject.type == 'Image') {
                    blocks[bodyB.gameObject.name].destroy()
                    countOfDestroyed = countOfDestroyed + 1
                    console.log('Destroyed: ', countOfDestroyed)
                    console.log('Total : ', countOfBlocks)

                    if (countOfDestroyed >= countOfBlocks) {
                        console.log('You are win!')
                        this.globalRestart('all block destroyed')
                    }

                }
                /* if (bodyB.gameObject && bodyB.gameObject.type == 'Image') {
                    console.log('bodyB : ', bodyA.gameObject)
                } */
            }

        })
    }
    stopTimeSkillInitHost() {
        console.log('init stop skill host')

        let w = config.width
        let h = config.height

        this.zone_time = this.add.zone(w - 280, h - 280, 160, 160)
        this.zone_time.setDepth(this.depth.UI)
        this.zone_time.setScrollFactor(0)

        this.timeDebug = this.add.sprite(w - 280, h - 280, 'time-skill')
        this.timeDebug.setScrollFactor(0)
        this.timeDebug.setDepth(this.depth.UI)


        // Add input callback
        this.zone_time.setInteractive()
        this.zone_time.on('pointerdown', this.stopTimeActivate, this)
    }
    stopTimeSkillInitSlave() {
        console.log('init stop skill slave')
        let w = config.width
        let h = config.height

        this.zone_time = this.add.zone(280, 280, 160, 160)
        this.zone_time.setDepth(this.depth.UI)
        this.zone_time.setScrollFactor(0)

        this.timeDebug = this.add.sprite(280, 280, 'time-skill')
        this.timeDebug.setScrollFactor(0)
        this.timeDebug.setDepth(this.depth.UI)


        // Add input callback
        this.zone_time.setInteractive()
        this.zone_time.on('pointerdown', this.stopTimeActivate, this)
    }

    // Если время пока не остановлено -> останавливаем его
    stopTimeActivate() {

        if (!this.timeStop && this.timeSkillBtnReady) {
            // if (this.timeSkillBtnReady) {

            this.timeSkillBtnReady = false

            // Если это slave, то нужно пробросить событие через сокет о том, что нужно остановить время на
            // master клиенте
            if (this.client && !this.client.master && mode.type == 'multi') {
                this.client.sayHostToStopTime()
            }

            this.timeStop = true


            this.timeDebug.alpha = 0.2
            console.log('stop game activate!')

            this.LAST_VELOCITY.x = this.ball.ball.body.velocity.x
            this.LAST_VELOCITY.y = this.ball.ball.body.velocity.y

            this.LAST_POSITION.x = this.ball.ball.x
            this.LAST_POSITION.y = this.ball.ball.y


            setTimeout(() => {
                console.log('Time goes itself turn!')
                this.timeStop = false
                this.ball.ball.setVelocityX(this.LAST_VELOCITY.x)
                this.ball.ball.setVelocityY(this.LAST_VELOCITY.y)
                this.firstSetBallPosition = false
            }, 1000)

            setTimeout(() => {
                this.timeDebug.alpha = 1
                console.log('Reload skill time!')
                this.timeSkillBtnReady = true
            }, 5000)

        }

    }

}