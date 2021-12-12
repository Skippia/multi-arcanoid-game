import { mode } from "../scenes/StartScene"


export default class Player {
    constructor(scene, map, config) {
        this.scene = scene
        this.map = map
        const position = this.map.getPlayerPosition(config.position)
        console.log('Create platform: ', config)
        console.log('Create platform position: ', position)

        this.player = this.scene.matter.add.sprite(position.x, position.y, 'objects', config.sprite)

        this.map.getPortalPosition()

        this.DIRECTIONS_HORIZONTAL = Object.freeze({ BACKWARD: -1, NONE: 0, FORWARD: 1 })
        this.SPEED_HORIZONTAL = 20
        this.DIRECTIONS_VERTICAL = Object.freeze({ BACKWARD: -1, NONE: 0, FORWARD: 1 })
        this.SPEED_VERTICAL = 10

        this.player.setBounce(1)
        this.player.setFriction(0)
        this.player.setDensity(1)
        this.player.setIgnoreGravity(true)
        this.player.setFixedRotation()
        this.player.setAngle(0)

        this.ball = this.scene.ball ///&&!!!!

    }
    create() {

    }
    get direction() {
        let directionH = this.DIRECTIONS_HORIZONTAL.NONE

        // Move platform via touch click
        if (this.scene.is_holding.direction === 'left') {
            if (this.scene.client && !this.scene.client.master && mode.type == 'multi') {
                directionH = this.DIRECTIONS_HORIZONTAL.FORWARD
            } else {
                directionH = this.DIRECTIONS_HORIZONTAL.BACKWARD
            }
        }
        else if (this.scene.is_holding.direction === 'right') {
            if (this.scene.client && !this.scene.client.master && mode.type == 'multi') {
                directionH = this.DIRECTIONS_HORIZONTAL.BACKWARD
            } else {
                directionH = this.DIRECTIONS_HORIZONTAL.FORWARD
            }
        }


        // Move platform via <- & -> arrows
        if (this.scene.cursors.right.isDown) {
            if (this.scene.client && !this.scene.client.master && mode.type == 'multi') {
                directionH = this.DIRECTIONS_HORIZONTAL.BACKWARD
            } else {
                directionH = this.DIRECTIONS_HORIZONTAL.FORWARD
            }
        } else if (this.scene.cursors.left.isDown) {
            if (this.scene.client && !this.scene.client.master && mode.type == 'multi') {
                directionH = this.DIRECTIONS_HORIZONTAL.FORWARD
            } else {
                directionH = this.DIRECTIONS_HORIZONTAL.BACKWARD
            }
        }


        return directionH
    }
    get velocity() {
        return this.direction * this.SPEED_HORIZONTAL
    }

    move() {
        this.player.setVelocity(this.velocity, 0)
    }
}
