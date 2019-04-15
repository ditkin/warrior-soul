/* eslint new-cap:0 */

import IG from '../impact'
import Box2D from './box2d'

class Box2DDebug {
  
  drawer = null
  canvas = null
  world = null

  alpha = 0.5
  thickness = 1.0

  constructor(world, alpha, thickness) {
    this.world = world
    this.canvas = IG.instance.system.canvas
    this.drawer = new Box2D.Dynamics.b2DebugDraw()
    this.drawer.SetSprite(this)
    this.drawer.SetDrawScale(1 / Box2D.SCALE * IG.instance.system.scale)
    this.drawer.SetFillAlpha(alpha || this.alpha)
    this.drawer.SetLineThickness(thickness || this.thickness)
    this.drawer.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit)
    world.SetDebugDraw(this.drawer)
  }

  draw() {
    IG.instance.system.context.save()
    IG.instance.system.context.translate(-IG.instance.game.screen.x * IG.instance.system.scale, -IG.instance.game.screen.y * IG.instance.system.scale)
    this.world.DrawDebugData()
    IG.instance.system.context.restore()
  }

  clearRect() {}

  beginPath() {
    IG.instance.system.context.lineWidth = this.strokeWidth
    IG.instance.system.context.fillStyle = this.fillStyle
    IG.instance.system.context.strokeStyle = this.strokeSyle
    IG.instance.system.context.beginPath()
  }

  arc(x, y, radius, startAngle, endAngle, counterClockwise) {
    IG.instance.system.context.arc(x, y, radius, startAngle, endAngle, counterClockwise)
  }

  closePath() {
    IG.instance.system.context.closePath()
  }

  fill() {
    IG.instance.system.context.fillStyle = this.fillStyle
    IG.instance.system.context.fill()
  }

  stroke() {
    IG.instance.system.context.stroke()
  }

  moveTo(x, y) {
    IG.instance.system.context.moveTo(x, y)
  }

  lineTo(x, y) {
    IG.instance.system.context.lineTo(x, y)
    IG.instance.system.context.stroke()
  }

}

// ig.Game.inject({
// 	loadLevel: function(data) {
// 		this.parent(data)
// 		this.debugDrawer = new ig.Box2DDebug(ig.world)
// 	},
// 	draw: function() {
// 		this.parent()
// 		this.debugDrawer.draw()
// 	}
// })

export default Box2DDebug