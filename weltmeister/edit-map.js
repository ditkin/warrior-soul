import { IG, ig, BackgroundMap, Image } from 'impact'
import Config from './config'

import TileSelect from './tile-select'

class EditMap extends BackgroundMap {
  name = ''
  visible = true
  active = true
  linkWithCollision = false
  
  div = null
  brush = [[0]]
  oldData = null
  hotkey = -1
  ignoreLastClick = false
  tileSelect = null
  
  isSelecting = false
  selectionBegin = null
  
  constructor(name, tilesize, tileset, foreground) {
    super(tilesize, [[0]], tileset || '')
    this.name = name
    this.foreground = foreground
    
    this.div = $('<div/>', {
      'class': 'layer layerActive', 
      'id': ('layer_' + name),
      'mouseup': this.click.bind(this),
    })
    this.setName(name)
    if (this.foreground) {
      $('#layers').prepend(this.div)
    } else {
      $('#layerEntities').after(this.div)
    }
    
    this.tileSelect = new TileSelect(this)
  }
  
  
  getSaveData() {
    return {
      name: this.name,
      width: this.width,
      height: this.height,
      linkWithCollision: this.linkWithCollision,
      visible: this.visible,
      tilesetName: this.tilesetName,
      repeat: this.repeat,
      preRender: this.preRender,
      distance: this.distance,
      tilesize: this.tilesize,
      foreground: this.foreground,
      data: this.data,
    }
  }
  
  
  resize(newWidth, newHeight) {
    var newData = new Array(newHeight)
    for (var y = 0; y < newHeight; y++) {
      newData[y] = new Array(newWidth)
      for (var x = 0; x < newWidth; x++) {
        newData[y][x] = (x < this.width && y < this.height) ? this.data[y][x] : 0
      }
    }
    this.data = newData
    this.width = newWidth
    this.height = newHeight
    
    this.resetDiv()
  }
  
  beginEditing() {
    this.oldData = ig.copy(this.data)
  }
  
  getOldTile(x, y) {
    var tx = Math.floor(x / this.tilesize)
    var ty = Math.floor(y / this.tilesize)
    if ( 
      (tx >= 0 && tx < this.width) &&
      (ty >= 0 && ty < this.height)
    ) {
      return this.oldData[ty][tx]
    } else {
      return 0
    }
  }
  
  setTileset(tileset) {
    if (this.name == 'collision') {
      this.setCollisionTileset()
    } else {
      super.setTileset(tileset)
    }
  }
  
  
  setCollisionTileset() {
    var path = Config.collisionTiles.path
    var scale = this.tilesize / Config.collisionTiles.tilesize
    this.tiles = new AutoResizedImage(path, scale)
  }
  
  
  
  
  
  // -------------------------------------------------------------------------
  // UI
  
  setHotkey(hotkey) {
    this.hotkey = hotkey
    this.setName(this.name)
  }
  
  
  setName(name) {
    this.name = name.replace(/[^0-9a-zA-Z]/g, '_')
    this.resetDiv()
  }
  
  
  resetDiv() {
    var visClass = this.visible ? ' checkedVis' : ''
    this.div.html(
      '<span class="visible' + visClass + '" title="Toggle Visibility (Shift+' + this.hotkey + ')"></span>' +
      '<span class="name">' + this.name + '</span>' +
      '<span class="size"> (' + this.width + 'x' + this.height + ')</span>'
    )
    this.div.attr('title', 'Select Layer (' + this.hotkey + ')')
    this.div.children('.visible').bind('mousedown', this.toggleVisibilityClick.bind(this))
  }
  
  
  setActive(active) {
    this.active = active
    if (active) {
      this.div.addClass('layerActive')
    } else {
      this.div.removeClass('layerActive')
    }
  }
  
  
  toggleVisibility() {
    this.visible ^= 1
    this.resetDiv()
    if (this.visible) {
      this.div.children('.visible').addClass('checkedVis')
    } else {
      this.div.children('.visible').removeClass('checkedVis')
    }
    IG.instance.game.draw()
  }
  
  
  toggleVisibilityClick(event) {
    if (!this.active) {
      this.ignoreLastClick = true
    }
    this.toggleVisibility()
  }
  
  
  click() {
    if (this.ignoreLastClick) {
      this.ignoreLastClick = false
      return
    }
    IG.instance.editor.setActiveLayer(this.name)
  }
  
  
  destroy() {
    this.div.remove()
  }
  
  
  
  // -------------------------------------------------------------------------
  // Selecting
  
  beginSelecting(x, y) {
    this.isSelecting = true
    this.selectionBegin = {x: x, y: y}
  }
  
    
  endSelecting(x, y) {
    var r = this.getSelectionRect(x, y)
    
    var brush = []
    for (var ty = r.y; ty < r.y + r.h; ty++) {
      var row = []
      for (var tx = r.x; tx < r.x + r.w; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
          row.push(0)
        } else {
          row.push(this.data[ty][tx])
        }
      }
      brush.push(row)
    }
    this.isSelecting = false
    this.selectionBegin = null
    return brush
  }
  
  
  getSelectionRect(x, y) {
    var sx = this.selectionBegin ? this.selectionBegin.x : x,
      sy = this.selectionBegin ? this.selectionBegin.y : y
      
    var
      txb = Math.floor((sx + this.scroll.x) / this.tilesize),
      tyb = Math.floor((sy + this.scroll.y) / this.tilesize),
      txe = Math.floor((x + this.scroll.x) / this.tilesize),
      tye = Math.floor((y + this.scroll.y) / this.tilesize)
    
    return {
      x: Math.min(txb, txe),
      y: Math.min(tyb, tye),
      w: Math.abs(txb - txe) + 1,
      h: Math.abs(tyb - tye) + 1,
    }
  }
  
  
  

  // -------------------------------------------------------------------------
  // Drawing
  
  draw() {
    // For performance reasons, repeated background maps are not drawn
    // when zoomed out
    if (this.visible && !(Config.view.zoom < 1 && this.repeat)) {
      this.drawTiled()
    }
    
    // Grid
    if (this.active && Config.view.grid) {
      
      var x = -IG.instance.system.getDrawPos(this.scroll.x % this.tilesize) - 0.5
      var y = -IG.instance.system.getDrawPos(this.scroll.y % this.tilesize) - 0.5
      var step = this.tilesize * IG.instance.system.scale
      
      IG.instance.system.context.beginPath()
      for (x; x < IG.instance.system.realWidth; x += step) {
        IG.instance.system.context.moveTo(x, 0)
        IG.instance.system.context.lineTo(x, IG.instance.system.realHeight)
      }
      for (y; y < IG.instance.system.realHeight; y += step) {
        IG.instance.system.context.moveTo(0, y)
        IG.instance.system.context.lineTo(IG.instance.system.realWidth, y)
      }
      IG.instance.system.context.strokeStyle = Config.colors.secondary
      IG.instance.system.context.stroke()
      IG.instance.system.context.closePath()
      
      // Not calling beginPath() again has some weird performance issues
      // in Firefox 5. closePath has no effect. So to make it happy:
      IG.instance.system.context.beginPath() 
    }
    
    // Bounds
    if (this.active) {
      IG.instance.system.context.lineWidth = 1
      IG.instance.system.context.strokeStyle = Config.colors.primary
      IG.instance.system.context.strokeRect( 
        -IG.instance.system.getDrawPos(this.scroll.x) - 0.5, 
        -IG.instance.system.getDrawPos(this.scroll.y) - 0.5, 
        this.width * this.tilesize * IG.instance.system.scale + 1, 
        this.height * this.tilesize * IG.instance.system.scale + 1
      )			
    }
  }
  
  getCursorOffset() {
    var w = this.brush[0].length
    var h = this.brush.length
    
    //return {x:0, y:0};
    return {
      x: (w / 2 - 0.5).toInt() * this.tilesize,
      y: (h / 2 - 0.5).toInt() * this.tilesize,
    }
  }
  
  drawCursor(x, y) {
    if (this.isSelecting) {
      var r = this.getSelectionRect(x, y)
    
      IG.instance.system.context.lineWidth = 1
      IG.instance.system.context.strokeStyle = Config.colors.selection
      IG.instance.system.context.strokeRect( 
        (r.x * this.tilesize - this.scroll.x) * IG.instance.system.scale - 0.5, 
        (r.y * this.tilesize - this.scroll.y) * IG.instance.system.scale - 0.5, 
        r.w * this.tilesize * IG.instance.system.scale + 1, 
        r.h * this.tilesize * IG.instance.system.scale + 1
      )
    } else {
      var w = this.brush[0].length
      var h = this.brush.length
      
      var co = this.getCursorOffset()
      
      var cx = Math.floor((x + this.scroll.x) / this.tilesize) * this.tilesize - this.scroll.x - co.x
      var cy = Math.floor((y + this.scroll.y) / this.tilesize) * this.tilesize - this.scroll.y - co.y
      
      IG.instance.system.context.lineWidth = 1
      IG.instance.system.context.strokeStyle = Config.colors.primary
      IG.instance.system.context.strokeRect( 
        IG.instance.system.getDrawPos(cx) - 0.5, 
        IG.instance.system.getDrawPos(cy) - 0.5, 
        w * this.tilesize * IG.instance.system.scale + 1, 
        h * this.tilesize * IG.instance.system.scale + 1
      )
      
      IG.instance.system.context.globalAlpha = 0.5
      for (var ty = 0; ty < h; ty++) {
        for (var tx = 0; tx < w; tx++) {
          var t = this.brush[ty][tx]
          if (t) {
            var px = cx + tx * this.tilesize
            var py = cy + ty * this.tilesize
            this.tiles.drawTile(px, py, t - 1, this.tilesize)
          }
        }
      }
      IG.instance.system.context.globalAlpha = 1
    }
  }
}


class AutoResizedImage extends Image {
  internalScale = 1
  
  static staticInstantiate() {
    return null // Never cache!
  }
  
  constructor(path, internalScale) {
    super(path)
    this.internalScale = internalScale
  }
  
  onload(event) {
    this.width = Math.ceil(this.data.width * this.internalScale)
    this.height = Math.ceil(this.data.height * this.internalScale)
    
    if (this.internalScale != 1) {
      var scaled = ig.$new('canvas')
      scaled.width = this.width
      scaled.height = this.height
      var scaledCtx = scaled.getContext('2d')
      
      scaledCtx.drawImage(this.data, 0, 0, this.data.width, this.data.height, 0, 0, this.width, this.height)
      this.data = scaled
    }
    
    this.loaded = true
    if (IG.instance.system.scale != 1) {
      this.resize(IG.instance.system.scale)
    }
    
    if (this.loadCallback) {
      this.loadCallback(this.path, true)
    }
  }
}


export default EditMap

export {
  AutoResizedImage,
}