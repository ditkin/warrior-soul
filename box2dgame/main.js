import {IG, Box2DGame, Font, Input} from 'impact'
// import { Sound } from '../lib/sound'

const data = require('./levels/aaa.json')
import PlayerEntity from './PlayerEntity'

class MyGame extends Box2DGame {
  
  // Load a font
  font = new Font('/media/04b03.font.png')

  // bgmusic = new Sound('media/bg.*', false)
  
  constructor() {
    super()
    // Initialize your game here; bind keys etc.

    // IG.instance.music.add(this.bgmusic)
    // IG.instance.music.play()
    
    IG.instance.input.bind(Input.KEY.RIGHT_ARROW, 'right')
    IG.instance.input.bind(Input.KEY.LEFT_ARROW, 'left')
    IG.instance.input.bind(Input.KEY.UP_ARROW, 'jump')

    this.gravity = 20
    
    this.loadLevel(data)
    this.player = this.spawnEntity(PlayerEntity, 20, 30)

  }
  
  update() {
    // Update all entities and backgroundMaps
    super.update()
    
    // Add your own, additional update code here
  }
  
  draw() {
    // Draw all entities and backgroundMaps
    super.draw()
    
    // Add your own drawing code here
    var x = IG.instance.system.width / 2,
      y = IG.instance.system.height / 2
    
    this.font.draw('It Works!', x, y, Font.ALIGN.CENTER)
  }
}

export default MyGame

