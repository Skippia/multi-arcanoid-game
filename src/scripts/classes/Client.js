const HOST = '/'

import Phaser from 'phaser'
import io from "socket.io/client-dist/socket.io"

export default class Client extends Phaser.Events.EventEmitter {
  constructor() {
    super()
  }

  init() {
    this.sent = {}
    this.master = false
    // Creating client-socket --> Auto emit event 'connect' to server
    this.socket = io(HOST)
    this.socket.on('connect', () => {
      console.log('client connected')
    })
    this.socket.on('disconnect', () => {
      console.log('client disconnected')
    })
    this.socket.on('gameStart', data => {
      if (data && data.master) {
        // For master player set this.master = true
        this.master = data.master
      }
      this.emit('game')
    })
    this.socket.on('enemyMove', data => {
      this.emit('data', data)
    })
    this.socket.on('enemyBallMove', ball => {
      this.emit('dataBall', ball)
    })
  }
  send(data, ball) {
    if (JSON.stringify(data) !== JSON.stringify(this.sent)) {
      this.sent = data
      this.socket.emit('playerMove', data)
    }
    if (ball) {
      // console.log('x : ', ball.x.toPrecision(2), 'y : ', ball.y.toPrecision(2))
      this.socket.emit('ballMove', ball)

    }


  }
}