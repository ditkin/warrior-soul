import Image from './image'
import IG from './impact'

class Font extends Image {

  static ALIGN = {
    LEFT: 0,
    RIGHT: 1,
    CENTER: 2,
  }


  widthMap = []
  indices = []
  firstChar = 32
  alpha = 1
  letterSpacing = 1
  lineSpacing = 0
  
  onload(ev) {
    this._loadMetrics(this.data)
    super.onload(ev)
  }


  widthForString(text) {
    // Multiline?
    if (text.indexOf('\n') !== -1) {
      var lines = text.split('\n')
      var width = 0
      for (var i = 0; i < lines.length; i++) {
        width = Math.max(width, this._widthForLine(lines[i]))
      }
      return width
    } else {
      return this._widthForLine(text)
    }
  }

  
  _widthForLine(text) {
    var width = 0
    for (var i = 0; i < text.length; i++) {
      width += this.widthMap[text.charCodeAt(i) - this.firstChar] + this.letterSpacing
    }
    return width
  }


  heightForString(text) {
    return text.split('\n').length * (this.height + this.lineSpacing)
  }
  
  
  draw(text, x, y, align) {
    if (typeof (text) != 'string') {
      text = text.toString()
    }
    
    // Multiline?
    if (text.indexOf('\n') !== -1) {
      var lines = text.split('\n')
      var lineHeight = this.height + this.lineSpacing
      for (var i = 0; i < lines.length; i++) {
        this.draw(lines[i], x, y + i * lineHeight, align)
      }
      return
    }
    
    if (align == Font.ALIGN.RIGHT || align == Font.ALIGN.CENTER) {
      var width = this._widthForLine(text)
      x -= align == Font.ALIGN.CENTER ? width / 2 : width
    }
    

    if (this.alpha !== 1) {
      IG.instance.system.context.globalAlpha = this.alpha
    }

    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i)
      x += this._drawChar(c - this.firstChar, x, y)
    }

    if (this.alpha !== 1) {
      IG.instance.system.context.globalAlpha = 1
    }
    Image.drawCount += text.length
  }
  
  
  _drawChar(c, targetX, targetY) {
    if (!this.loaded || c < 0 || c >= this.indices.length) {
      return 0 
    }
    
    var scale = IG.instance.system.scale
    
    
    var charX = this.indices[c] * scale
    var charY = 0
    var charWidth = this.widthMap[c] * scale
    var charHeight = (this.height - 2) * scale		
    
    IG.instance.system.context.drawImage( 
      this.data,
      charX, charY,
      charWidth, charHeight,
      IG.instance.system.getDrawPos(targetX), IG.instance.system.getDrawPos(targetY),
      charWidth, charHeight
    )
    
    return this.widthMap[c] + this.letterSpacing
  }
  
  
  _loadMetrics(image) {
    // Draw the bottommost line of this font image into an offscreen canvas
    // and analyze it pixel by pixel.
    // A run of non-transparent pixels represents a character and its width
    
    this.height = image.height - 1
    this.widthMap = []
    this.indices = []
    
    var px = IG.instance.getImagePixels(image, 0, image.height - 1, image.width, 1)
    
    var currentChar = 0
    var currentWidth = 0
    for (var x = 0; x < image.width; x++) {
      var index = x * 4 + 3 // alpha component of this pixel
      if (px.data[index] > 127) {
        currentWidth++
      } else if (px.data[index] < 128 && currentWidth) {
        this.widthMap.push(currentWidth)
        this.indices.push(x - currentWidth)
        currentChar++
        currentWidth = 0
      }
    }
    this.widthMap.push(currentWidth)
    this.indices.push(x - currentWidth)
  }
}


export default Font