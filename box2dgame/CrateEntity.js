import {Box2DEntity, AnimationSheet} from 'impact'

class EntityCrate extends Box2DEntity {
  size = {x: 8, y: 8}
  type = Box2DEntity.TYPE.B
  checkAgainst = Box2DEntity.TYPE.NONE
  collides = Box2DEntity.COLLIDES.NEVER
  
  constructor(x, y, settings) {
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/crate.png', 8, 8)
    this.addAnim('idle', 1, [0])

    this.createBody() // this is important!
  }

}

export default EntityCrate