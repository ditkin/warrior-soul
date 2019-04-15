import Entity from '../entity'
import IG from '../impact'

class DebuggableEntity {

  static colors = {
    names: '#fff',
    velocities: '#0f0',
    boxes: '#f00',
  }

  static _debugEnableChecks = true
  static _debugShowBoxes = false
  static _debugShowVelocities = false
  static _debugShowNames = false

  static checkPair(a, b) {
    if (!DebuggableEntity._debugEnableChecks) {
      return
    }
    Entity.checkPair(a, b)
  }


  static draw(ent) {

    // Collision Boxes
    if (DebuggableEntity._debugShowBoxes) {
      IG.instance.system.context.strokeStyle = DebuggableEntity.colors.boxes
      IG.instance.system.context.lineWidth = 1.0
      IG.instance.system.context.strokeRect(	
        IG.instance.system.getDrawPos(ent.pos.x.round() - IG.instance.game.screen.x) - 0.5,
        IG.instance.system.getDrawPos(ent.pos.y.round() - IG.instance.game.screen.y) - 0.5,
        ent.size.x * IG.instance.system.scale,
        ent.size.y * IG.instance.system.scale
      )
    }
    
    // Velocities
    if (DebuggableEntity._debugShowVelocities) {
      var x = ent.pos.x + ent.size.x / 2
      var y = ent.pos.y + ent.size.y / 2
      
      DebuggableEntity._debugDrawLine(DebuggableEntity.colors.velocities, x, y, x + ent.vel.x, y + ent.vel.y)
    }
    
    // Names & Targets
    if (DebuggableEntity._debugShowNames) {
      if (ent.name) {
        IG.instance.system.context.fillStyle = DebuggableEntity.colors.names
        IG.instance.system.context.fillText(
          ent.name,
          IG.instance.system.getDrawPos(ent.pos.x - IG.instance.game.screen.x), 
          IG.instance.system.getDrawPos(ent.pos.y - IG.instance.game.screen.y)
        )
      }
      
      if (typeof (ent.target) == 'object') {
        for (var t in ent.target) {
          var ent = IG.instance.game.getEntityByName(ent.target[t])
          if (ent) {
            DebuggableEntity._debugDrawLine(DebuggableEntity.colors.names,
              ent.pos.x + ent.size.x / 2, ent.pos.y + ent.size.y / 2,
              ent.pos.x + ent.size.x / 2, ent.pos.y + ent.size.y / 2
            )
          }
        }
      }
    }
  }
  
  static _debugDrawLine(color, sx, sy, dx, dy) {
    IG.instance.system.context.strokeStyle = color
    IG.instance.system.context.lineWidth = 1.0

    IG.instance.system.context.beginPath()
    IG.instance.system.context.moveTo( 
      IG.instance.system.getDrawPos(sx - IG.instance.game.screen.x),
      IG.instance.system.getDrawPos(sy - IG.instance.game.screen.y)
    )
    IG.instance.system.context.lineTo( 
      IG.instance.system.getDrawPos(dx - IG.instance.game.screen.x),
      IG.instance.system.getDrawPos(dy - IG.instance.game.screen.y)
    )
    IG.instance.system.context.stroke()
    IG.instance.system.context.closePath()
  }
}


export default DebuggableEntity