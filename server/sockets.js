const socketIO = require('socket.io')

module.exports = {
    init(server) {
        this.sessions = []
        this.io = socketIO(server)
        this.io.on('connection', socket => {
            socket.on('playerMove', data => {
                this.onPlayerMove(socket, data)
            })
            socket.on('ballMove', ball => {
                this.onBallMove(socket, ball)
            })
            socket.on('playerHP', playerHP => {
                this.onPlayerHP(socket, playerHP)
            })
            socket.on('enemyHP', enemyHP => {
                this.onEnemyHP(socket, enemyHP)
            })
            socket.on('sayHostToStopTime', () => {
                this.sayHostToStopTime(socket)
            })
            /*    socket.on('end', () => {
                   // socket.disonnect()
                   this.sessions = []
                   console.log('clear sessions')
                   console.log(this.sessions)

                   // console.log('Server socket disconnect!!')

               }) */
            // Когда к серверу подключается клиент - устанавливается сокетное взаимодействие
            this.onConnection(socket)
        })
    },
    onPlayerMove(socket, data) {

        const session = this.sessions.find(session => session.playerSocket === socket || session.enemySocket === socket)

        if (session) {
            let opponentSocket = null

            if (session.playerSocket === socket) {
                opponentSocket = session.enemySocket
            } else {
                opponentSocket = session.playerSocket
            }
            if (opponentSocket) {
                opponentSocket.emit('enemyMove', data)
            }
        }
    },
    onBallMove(socket, ball) {

        // Ищем сессию , отправившиую запрос
        const session = this.sessions.find(session => session.playerSocket === socket || session.enemySocket === socket)

        if (session) {
            let opponentSocket = null
            // Если наша сессия - сессия игрока, значит противоложная сессия - врага
            if (session.playerSocket === socket) {
                opponentSocket = session.enemySocket
            } else {
                opponentSocket = session.playerSocket
            }
            if (opponentSocket) {
                opponentSocket.emit('enemyBallMove', ball)
            }
        }
    },

    onPlayerHP(socket, playerHP) {
        // Ищем сессию , отправившиую запрос
        const session = this.sessions.find(session => session.playerSocket === socket || session.enemySocket === socket)

        if (session) {
            let opponentSocket = null
            // Если наша сессия - сессия игрока, значит противоложная сессия - врага
            if (session.playerSocket === socket) {
                opponentSocket = session.enemySocket
            } else {
                opponentSocket = session.playerSocket
            }
            if (opponentSocket) {
                opponentSocket.emit('playerHP', playerHP)
            }
        }
    },
    onEnemyHP(socket, enemyHP) {
        // Ищем сессию , отправившиую запрос
        const session = this.sessions.find(session => session.playerSocket === socket || session.enemySocket === socket)

        if (session) {
            let opponentSocket = null
            // Если наша сессия - сессия игрока, значит противоложная сессия - врага
            if (session.playerSocket === socket) {
                opponentSocket = session.enemySocket
            } else {
                opponentSocket = session.playerSocket
            }
            if (opponentSocket) {
                opponentSocket.emit('enemyHP', enemyHP)
            }
        }
    },
    sayHostToStopTime(socket) {
        // Ищем сессию , отправившиую запрос
        const session = this.sessions.find(session => session.playerSocket === socket || session.enemySocket === socket)

        if (session) {
            let opponentSocket = null
            // Если наша сессия - сессия игрока, значит противоложная сессия - врага
            if (session.playerSocket === socket) {
                opponentSocket = session.enemySocket
            } else {
                opponentSocket = session.playerSocket
            }
            if (opponentSocket) {
                opponentSocket.emit('sayHostToStopTime')
            }
        }

    },

    // находит сессию, в которой есть сокет игрока, но нет сокета противника (игрок ждет оппонента)
    getPendingSession() {
        return this.sessions.find(session => session.playerSocket && !session.enemySocket)
    },
    createPendingSession(socket) {
        const session = { playerSocket: socket, enemySocket: null }
        this.sessions.push(session)

    },
    startGame(session) {
        // Тут мы иницириуем событие начала игры, которое прослушивается в клиенте
        //(сокет клиента инициирует событие)
        // <==> socket.emit('gameStart')
        session.playerSocket.emit('gameStart', { master: true })
        session.enemySocket.emit('gameStart')
    },
    onConnection(socket) {
        console.log(`new user connected ${socket.id}`)

        // получить текущую ожидающую игровую сессию
        let session = this.getPendingSession()

        // если такой сессии нет
        if (!session) {
            // создать новую игровую сессию и поместить в нее сокет игрока
            this.createPendingSession(socket)
        } else { // если такая сессия есть - игрок уже есть и ждет противника
            // добавить в нее сокет противника
            session.enemySocket = socket
            // запустить игру событием в оба сокета
            this.startGame(session)
        }
    }

}
