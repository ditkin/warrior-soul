import Timer from './timer'
import Image from './image'
import IG from './impact'


class AnimationSheet {
  width = 8
  height = 8
  image = null
  
  constructor(path, width, height) {
    this.width = width
    this.height = height
    
    this.image = new Image(path)
  }
}



class Animation {
  sheet = null
  timer = null
  
  sequence = []
  flip = {x: false, y: false}
  pivot = {x: 0, y: 0}
  
  frame = 0
  tile = 0
  loopCount = 0
  alpha = 1
  angle = 0
  
  
  constructor(sheet, frameTime, sequence, stop) {
    this.sheet = sheet
    this.pivot = {x: sheet.width / 2, y: sheet.height / 2 }
    this.timer = new Timer()

    this.frameTime = frameTime
    this.sequence = sequence
    this.stop = !!stop
    this.tile = this.sequence[0]
  }
  
  
  rewind() {
    this.timer.set()
    this.loopCount = 0
    this.frame = 0
    this.tile = this.sequence[0]
    return this
  }
  
  
  gotoFrame(f) {
    // Offset the timer by one tenth of a millisecond to make sure we
    // jump to the correct frame and circumvent rounding errors
    this.timer.set(this.frameTime * -f - 0.0001)
    this.update()
  }
  
  
  gotoRandomFrame() {
    this.gotoFrame(Math.floor(Math.random() * this.sequence.length))
  }
  
  
  update() {
    var frameTotal = Math.floor(this.timer.delta() / this.frameTime)
    this.loopCount = Math.floor(frameTotal / this.sequence.length)
    if (this.stop && this.loopCount > 0) {
      this.frame = this.sequence.length - 1
    } else {
      this.frame = frameTotal % this.sequence.length
    }
    this.tile = this.sequence[this.frame]
  }
  
  
  draw(targetX, targetY) {
    var bbsize = Math.max(this.sheet.width, this.sheet.height)
    
    // On screen?
    if (
      targetX > IG.instance.system.width || targetY > IG.instance.system.height ||
       targetX + bbsize < 0 || targetY + bbsize < 0
    ) {
      return
    }
    
    if (this.alpha != 1) {
      IG.instance.system.context.globalAlpha = this.alpha
    }
    
    if (this.angle == 0) {		
      this.sheet.image.drawTile(
        targetX, targetY,
        this.tile, this.sheet.width, this.sheet.height,
        this.flip.x, this.flip.y
      )
    } else {
      IG.instance.system.context.save()
      IG.instance.system.context.translate(
        IG.instance.system.getDrawPos(targetX + this.pivot.x),
        IG.instance.system.getDrawPos(targetY + this.pivot.y)
      )
      IG.instance.system.context.rotate(this.angle)
      this.sheet.image.drawTile(
        -this.pivot.x, -this.pivot.y,
        this.tile, this.sheet.width, this.sheet.height,
        this.flip.x, this.flip.y
      )
      IG.instance.system.context.restore()
    }
    
    if (this.alpha != 1) {
      IG.instance.system.context.globalAlpha = 1
    }
  }
}

export default Animation

export {
  AnimationSheet,
}