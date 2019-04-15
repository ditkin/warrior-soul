import {ig} from './igUtils'
import IG from './impact'
import Timer from './timer'

class DrawMode {

  scale = 1

  constructor(scale){
    this.scale = scale
  }

  AUTHENTIC(p) {
    return Math.round(p) * this.scale 
  }
  SMOOTH(p) {
    return Math.round(p * this.scale) 
  }
  SUBPIXEL(p) {
    return p * this.scale 
  }
}

class System {
  
  drawMode = new DrawMode(this.scale).SMOOTH;
  
  static SCALE = {
    CRISP: function(canvas, context) {
      ig.setVendorAttribute(context, 'imageSmoothingEnabled', false)
      canvas.style.imageRendering = '-moz-crisp-edges'
      canvas.style.imageRendering = '-o-crisp-edges'
      canvas.style.imageRendering = '-webkit-optimize-contrast'
      canvas.style.imageRendering = 'crisp-edges'
      canvas.style.msInterpolationMode = 'nearest-neighbor' // No effect on Canvas :/
    },
    SMOOTH: function(canvas, context) {
      ig.setVendorAttribute(context, 'imageSmoothingEnabled', true)
      canvas.style.imageRendering = ''
      canvas.style.msInterpolationMode = ''
    },
  };
  scaleMode = System.SCALE.SMOOTH;

  fps = 30
  width = 320
  height = 240
  realWidth = 320
  realHeight = 240
  scale = 1
  
  tick = 0
  animationId = 0
  newGameClass = null
  running = false
  
  delegate = null
  clock = null
  canvas = null
  context = null
  
  constructor(canvasId, fps, width, height, scale) {
    this.fps = fps
    
    this.clock = new Timer()
    this.canvas = ig.$(canvasId)
    this.resize(width, height, scale)
    this.context = this.canvas.getContext('2d')
    
    this.getDrawPos = this.drawMode

    // Automatically switch to crisp scaling when using a scale
    // other than 1
    if (this.scale != 1) {
      this.scaleMode = System.SCALE.CRISP
    }
    this.scaleMode(this.canvas, this.context)
  }
  
  
  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale || this.scale
    
    this.realWidth = this.width * this.scale
    this.realHeight = this.height * this.scale
    this.canvas.width = this.realWidth
    this.canvas.height = this.realHeight
  }
  
  
  setGame(gameClass) {
    if (this.running) {
      this.newGameClass = gameClass
    } else {
      this.setGameNow(gameClass)
    }
  }
  
  setGameNow(gameClass) {
    IG.instance.game = new (gameClass)()	
    this.setDelegate(IG.instance.game)
  }
  
  
  setDelegate(object) {
    if (typeof (object.run) == 'function') {
      this.delegate = object
      this.startRunLoop()
    } else {
      throw ('System.setDelegate: No run() function in object')
    }
  }
  
  // TODO
  stopRunLoop() {
    IG.instance.clearAnimation(this.animationId)
    this.running = false
  }
  
  
  startRunLoop() {
    this.stopRunLoop()
    this.animationId = IG.instance.setAnimation(() => this.run(), this.canvas)
    this.running = true
  }
  
  
  clear(color) {
    this.context.fillStyle = color
    this.context.fillRect(0, 0, this.realWidth, this.realHeight)
  }
  
  
  run() {
    Timer.step()
    this.tick = this.clock.tick()
    
    this.delegate.run()
    IG.instance.input.clearPressed()
    
    if (this.newGameClass) {
      this.setGameNow(this.newGameClass)
      this.newGameClass = null
    }
  }
  
  
  getDrawPos = null // Set through constructor
}

export default System

