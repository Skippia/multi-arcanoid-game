import Phaser from "phaser"
import BootScene from './scripts/scenes/BootScene'
import PreloadScene from './scripts/scenes/PreloadScene'
import StartScene from "./scripts/scenes/StartScene"
import GameScene from './scripts/scenes/GameScene'
import WinFinishScene from "./scripts/scenes/WinFinishScene"
import LostFinishScene from "./scripts/scenes/LostFinishScene"

const config = {
    type: Phaser.AUTO,
    width: 2175,
    height: 1024,
    scene: [BootScene, PreloadScene, StartScene, GameScene, LostFinishScene, WinFinishScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            debug: true,
            gravity: { x: 0, y: 0 }
        }
    }
}

const game = new Phaser.Game(config)


export default config