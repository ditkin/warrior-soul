/* eslint new-cap: 0 */
import IG from '../impact'
import Entity from '../entity'
import Box2D from './box2d'

class Box2DEntity extends Entity {
  body = null
  angle = 0
  
  createBody() {

    if (IG.instance.global.wm === true) { 
      return
    }

    var bodyDef = new Box2D.Dynamics.b2BodyDef()
    bodyDef.position = new Box2D.Common.Math.b2Vec2(
      (this.pos.x + this.size.x / 2) * Box2D.SCALE,
      (this.pos.y + this.size.y / 2) * Box2D.SCALE
    ) 
    bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody
    this.body = IG.instance.extensions.world.CreateBody(bodyDef)

    var fixture = new Box2D.Dynamics.b2FixtureDef
    fixture.shape = new Box2D.Collision.Shapes.b2PolygonShape()
    fixture.shape.SetAsBox(
      this.size.x / 2 * Box2D.SCALE,
      this.size.y / 2 * Box2D.SCALE
    )
    
    fixture.density = 1.0
    fixture.friction = this.friction;
    fixture.restitution = this.bounciness;

    this.body.CreateFixture(fixture)
  }
  
  update() {		
    var p = this.body.GetPosition()
    this.pos = {
      x: (p.x / Box2D.SCALE - this.size.x / 2),
      y: (p.y / Box2D.SCALE - this.size.y / 2),
    }
    this.angle = this.body.GetAngle().round(2)
    
    if (this.currentAnim) {
      this.currentAnim.update()
      this.currentAnim.angle = this.angle
    }
  }
  
  kill() {
    IG.instance.extensions.world.DestroyBody(this.body)
    this.parent()
  }
  
}

export default Box2DEntity
