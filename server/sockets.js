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

        const session = this.sessions.find(session => session.playerSocket === socket || session.enemySocket === socket)

        if (session) {
            let opponentSocket = null

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
    // находит сессию, в которой есть сокет игрока, но нет сокета противника (игрок ждет оппонента)
    getPendingSession() {
        return this.sessions.find(session => session.playerSocket && !session.enemySocket)
    },
    createPendingSession(socket) {
        const session = { playerSocket: socket, enemySocket: null }
        this.sessions.push(session)
    },
    startGame(session) {
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
