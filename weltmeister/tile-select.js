import {IG} from 'impact'
import Config from './config'

class TileSelect {
  
  pos = {x: 0, y: 0}
  
  layer = null
  selectionBegin = null
  
  constructor(layer) {
    this.layer = layer
  }
  
  
  getCurrentTile() {
    var b = this.layer.brush
    if (b.length == 1 && b[0].length == 1) {
      return b[0][0] - 1
    } else {
      return -1
    }
  }
  
  
  setPosition(x, y) {
    this.selectionBegin = null
    var tile = this.getCurrentTile()
    this.pos.x = 
      Math.floor(x / this.layer.tilesize) * this.layer.tilesize 
      - Math.floor(tile * this.layer.tilesize) % this.layer.tiles.width
      
    this.pos.y = 
      Math.floor(y / this.layer.tilesize) * this.layer.tilesize 
      - Math.floor(tile * this.layer.tilesize / this.layer.tiles.width) * this.layer.tilesize
      - (tile == -1 ? this.layer.tilesize : 0)
      
    this.pos.x = this.pos.x.limit(0, IG.instance.system.width - this.layer.tiles.width - (IG.instance.system.width % this.layer.tilesize))
    this.pos.y = this.pos.y.limit(0, IG.instance.system.height - this.layer.tiles.height - (IG.instance.system.height % this.layer.tilesize))
  }
  
  
  beginSelecting(x, y) {
    this.selectionBegin = {x: x, y: y}
  }
  
    
  endSelecting(x, y) {
    var r = this.getSelectionRect(x, y)
    
    var mw = Math.floor(this.layer.tiles.width / this.layer.tilesize)
    var mh = Math.floor(this.layer.tiles.height / this.layer.tilesize)
    
    var brush = []
    for (var ty = r.y; ty < r.y + r.h; ty++) {
      var row = []
      for (var tx = r.x; tx < r.x + r.w; tx++) {
        if (tx < 0 || ty < 0 || tx >= mw || ty >= mh) {
          row.push(0)
        } else {
          row.push(ty * Math.floor(this.layer.tiles.width / this.layer.tilesize) + tx + 1)
        }
      }
      brush.push(row)
    }
    this.selectionBegin = null
    return brush
  }
  
  
  getSelectionRect(x, y) {
    var sx = this.selectionBegin ? this.selectionBegin.x : x,
      sy = this.selectionBegin ? this.selectionBegin.y : y
      
    var
      txb = Math.floor((sx - this.pos.x) / this.layer.tilesize),
      tyb = Math.floor((sy - this.pos.y) / this.layer.tilesize),
      txe = Math.floor((x - this.pos.x) / this.layer.tilesize),
      tye = Math.floor((y - this.pos.y) / this.layer.tilesize)
    
    return {
      x: Math.min(txb, txe),
      y: Math.min(tyb, tye),
      w: Math.abs(txb - txe) + 1,
      h: Math.abs(tyb - tye) + 1,
    }
  }
  
  
  draw() {
    IG.instance.system.clear('rgba(0,0,0,0.8)') 
    if (!this.layer.tiles.loaded) {
      return
    }
    
    // Tileset
    IG.instance.system.context.lineWidth = 1
    IG.instance.system.context.strokeStyle = Config.colors.secondary
    IG.instance.system.context.fillStyle = Config.colors.clear
    IG.instance.system.context.fillRect( 
      this.pos.x * IG.instance.system.scale, 
      this.pos.y * IG.instance.system.scale, 
      this.layer.tiles.width * IG.instance.system.scale, 
      this.layer.tiles.height * IG.instance.system.scale
    )
    IG.instance.system.context.strokeRect( 
      this.pos.x * IG.instance.system.scale - 0.5, 
      this.pos.y * IG.instance.system.scale - 0.5, 
      this.layer.tiles.width * IG.instance.system.scale + 1, 
      this.layer.tiles.height * IG.instance.system.scale + 1
    )
    
    this.layer.tiles.draw(this.pos.x, this.pos.y)
    
    // Selected Tile
    var tile = this.getCurrentTile()
    var tx = Math.floor(tile * this.layer.tilesize) % this.layer.tiles.width + this.pos.x
    var ty = 
      Math.floor(tile * this.layer.tilesize / this.layer.tiles.width)
      * this.layer.tilesize + this.pos.y 
      + (tile == -1 ? this.layer.tilesize : 0)
    
    IG.instance.system.context.lineWidth = 1
    IG.instance.system.context.strokeStyle = Config.colors.highlight
    IG.instance.system.context.strokeRect( 
      tx * IG.instance.system.scale - 0.5, 
      ty * IG.instance.system.scale - 0.5, 
      this.layer.tilesize * IG.instance.system.scale + 1, 
      this.layer.tilesize * IG.instance.system.scale + 1
    )
  }
  
  
  drawCursor(x, y) {  
    var cx = Math.floor(x / this.layer.tilesize) * this.layer.tilesize
    var cy = Math.floor(y / this.layer.tilesize) * this.layer.tilesize
    
    var r = this.getSelectionRect(x, y)
    
    IG.instance.system.context.lineWidth = 1
    IG.instance.system.context.strokeStyle = Config.colors.selection
    IG.instance.system.context.strokeRect( 
      (r.x * this.layer.tilesize + this.pos.x) * IG.instance.system.scale - 0.5, 
      (r.y * this.layer.tilesize + this.pos.y) * IG.instance.system.scale - 0.5, 
      r.w * this.layer.tilesize * IG.instance.system.scale + 1, 
      r.h * this.layer.tilesize * IG.instance.system.scale + 1
    )
  }

}


export default TileSelect