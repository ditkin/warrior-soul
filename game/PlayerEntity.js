import {Entity, IG, AnimationSheet} from 'impact'

class PlayerEntity extends Entity {


  constructor(x, y, settings){
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/player.png', 16, 20)

    this.friction.x = 20
    this.gravityFactor = 10

    this.addAnim('idle', 0.1, [0])
    this.addAnim('jump', 0.1, [1, 2])

  }

  update(){
    super.update()

    if (IG.instance.input.state('right')){
      if (this.vel.x < 0){
        this.vel.x = 0
      }
      this.vel.x += 2
    }
    if (IG.instance.input.state('left')){
      if (this.vel.x > 0){
        this.vel.x = 0
      }
      this.vel.x -= 2
    }
    if (IG.instance.input.pressed('jump')){
      this.currentAnim = this.anims['jump']
      this.vel.y -= 50
    }

    if (this.vel.y == 0){
      this.currentAnim = this.anims['idle']
    }


  }

}

export default PlayerEntity