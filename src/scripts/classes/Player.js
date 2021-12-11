

export default class Player {
    constructor(scene, map, config) {
        this.scene = scene
        this.map = map
        const position = this.map.getPlayerPosition(config.position)

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
    get directions() {
        let directionH = this.DIRECTIONS_HORIZONTAL.NONE
        let directionV = this.DIRECTIONS_VERTICAL.NONE


        if (this.scene.cursors.right.isDown) {
            if (this.scene.client && !this.scene.client.master) {
                directionH = this.DIRECTIONS_HORIZONTAL.BACKWARD
            } else {
                directionH = this.DIRECTIONS_HORIZONTAL.FORWARD
            }
        } else if (this.scene.cursors.left.isDown) {
            if (this.scene.client && !this.scene.client.master) {
                directionH = this.DIRECTIONS_HORIZONTAL.FORWARD
            } else {
                directionH = this.DIRECTIONS_HORIZONTAL.BACKWARD
            }
        }


        return [directionH, directionV]
    }
    get velocity() {
        return [this.directions[0] * this.SPEED_HORIZONTAL, this.directions[1] * this.SPEED_VERTICAL]
    }

    move() {
        this.player.setVelocity(this.velocity[0], this.velocity[1])
    }
}
