import {Box2DEntity, IG, AnimationSheet, Box2DUtils} from 'impact'

class PlayerEntity extends Box2DEntity {

  size = {x: 8, y: 14}
  offset = {x: 4, y: 2}
  
  type = Box2DEntity.TYPE.A
  checkAgainst = Box2DEntity.TYPE.NONE
  collides = Box2DEntity.COLLIDES.NEVER

  flip = false

  constructor(x, y, settings){
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/player.png', 16, 20)

    this.addAnim('idle', 0.1, [0])
    this.addAnim('jump', 0.1, [1, 2])

    this.createBody() // this is important!
  }

  update(){
    super.update()

    if (IG.instance.input.state('right')){
      const force = new Box2DUtils.B2Vec2(20, 0)
      this.body.ApplyForce(force, this.body.GetPosition())
    }
    if (IG.instance.input.state('left')){
      const force = new Box2DUtils.B2Vec2(-20, 0)
      this.body.ApplyForce(force, this.body.GetPosition())
    }
    if (IG.instance.input.pressed('jump')){
      const force = new Box2DUtils.B2Vec2(0, -20)
      this.body.ApplyImpulse(force, this.body.GetPosition())
    }

    if (this.vel.y == 0){
      this.currentAnim = this.anims['idle']
    }


  }

}

export default PlayerEntity