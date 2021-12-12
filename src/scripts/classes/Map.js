export default class Map {
    constructor(scene) {
        this.scene = scene
        this.portals = null
        this.init()
        this.create()
    }
    init() {
        this.tilemap = this.scene.make.tilemap({ key: 'tilemap' })
    }
    create() {
        this.createCollision()
        this.createCheckpoints()
        this.createPortals()
    }

    // Помещаем объекты с карты tilemap со слоя collisions на canvas
    createCollision() {
        this.tilemap.findObject('collisions', collision => {
            const sprite = this.scene.matter.add.sprite(collision.x + collision.width / 2, collision.y - collision.height / 2, 'objects', collision.name)
            sprite.setStatic(true)
            sprite.setIgnoreGravity(true)
            sprite.setBounce(0.9)
            sprite.setFriction(0, 0, 0)
        })
    }
    // Создаем области пересечения для отслеживания условия проигрыша игроков
    createCheckpoints() {
        this.checkpoints = []
        this.tilemap.findObject('checkpoints', checkpoint => {
            let rectangle = new Phaser.Geom.Rectangle(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height)
            if (checkpoint.properties.find(property => property.name === 'value')
                &&
                checkpoint.properties.find(property => property.name === 'value').position) {
                rectangle.index = checkpoint.properties.find(property => property.name === 'value').position
                this.checkpoints.push(rectangle)
            }
        })
    }
    // Создаем порталы
    createPortals() {
        this.tilemap.findObject('overlaps', portalSprite => {
            let portal = this.scene.matter.add.sprite(portalSprite.x + portalSprite.width / 2,
                portalSprite.y - portalSprite.height / 2,
                'objects', portalSprite.name)
            portal.setStatic(true)
            portal.setSensor(true)

        })
    }

    // Получаем положение игрока по его имени
    getPlayerPosition(positionName) {
        return this.tilemap.findObject(positionName, position => {
            return position.name === positionName
        })
    }
    // Получаем положение портала по его имени
    getPortalPosition(name) {
        return this.tilemap.findObject('overlaps', position => {
            return position.name === name
        })
    }

    getCheckpoint(ball) {
        // Проверяем пересекает ли мяч один из наших чекпоинтов
        const checkpoint = this.checkpoints.find(checkpoint => checkpoint.contains(ball.x, ball.y))
        // Возвращаем кастомное свойство checkpoint'a
        return checkpoint && checkpoint.index
    }

}