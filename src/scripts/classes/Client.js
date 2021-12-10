const HOST = 'http://localhost:3000'

import Phaser from 'phaser'
import io from "socket.io/client-dist/socket.io"

export default class Client extends Phaser.Events.EventEmitter {
  constructor() {
    super()
  }

  init() {
    this.master = false
    // Creating client-socket --> Auto emit event 'connect' to server
    const socket = io(HOST)
    socket.on('connect', () => {
      console.log('client connected')
    })
    socket.on('disconnect', () => {
      console.log('client disconnected')
    })
    socket.on('gameStart', data => {
      if (data && data.master) {
        // For master player set this.master = true
        this.master = data.master
      }
      this.emit('game')
    })
  }
}