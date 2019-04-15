import {IG, Image as ImpactImage, Loader, ig } from 'impact'
import EventedInput from './evented-input'
import {Sound} from 'impact'
import Config from './config'
import EditMap from './edit-map'
import EditEntities from './edit-entities'
import SelectFileDropdown from './select-file-dropdown'
import ModalDialog, {ModalDialogPathSelect} from './modal-dialogs'
import Undo from './undo'


class Weltmeister {	
  static MODE = {
    DRAW: 1,
    TILESELECT: 2,
    ENTITYSELECT: 4,
  }

  static entityFiles = []
  static entityModules = []

  static getMaxWidth = function() {
    return $(window).width()
  };
  
  static getMaxHeight = function() {
    return $(window).height() - $('#headerMenu').height()
  };

  levelData = {}
  layers = []
  entities = null
  activeLayer = null
  collisionLayer = null
  selectedEntity = null
  
  screen = {x: 0, y: 0}
  _rscreen = {x: 0, y: 0}
  mouseLast = {x: -1, y: -1}
  waitForModeChange = false
  
  tilsetSelectDialog = null
  levelSavePathDialog = null
  labelsStep = 32
  
  collisionSolid = 1
  
  loadDialog = null
  saveDialog = null
  loseChangesDialog = null
  fileName = 'untitled.js'
  filePath = Config.project.levelPath + 'untitled.js'
  modified = false
  needsDraw = true
  
  undo = null
  
  constructor() {

    IG.instance.game = IG.instance.editor = this
    
    IG.instance.system.context.textBaseline = 'top'
    IG.instance.system.context.font = Config.labels.font
    this.labelsStep = Config.labels.step
      
    
    // Dialogs
    this.loadDialog = new ModalDialogPathSelect('Load Level', 'Load', 'scripts')
    this.loadDialog.onOk = this.load.bind(this)
    this.loadDialog.setPath(Config.project.levelPath)
    $('#levelLoad').bind('click', this.showLoadDialog.bind(this))
    $('#levelNew').bind('click', this.showNewDialog.bind(this))
    
    this.saveDialog = new ModalDialogPathSelect('Save Level', 'Save', 'scripts')
    this.saveDialog.onOk = this.save.bind(this)
    this.saveDialog.setPath(Config.project.levelPath)
    $('#levelSaveAs').bind('click', this.saveDialog.open.bind(this.saveDialog))
    $('#levelSave').bind('click', this.saveQuick.bind(this))
    
    this.loseChangesDialog = new ModalDialog('Lose all changes?')
    
    this.deleteLayerDialog = new ModalDialog('Delete Layer? NO UNDO!')
    this.deleteLayerDialog.onOk = this.removeLayer.bind(this)
    
    this.mode = Weltmeister.MODE.DEFAULT
    
    
    this.tilesetSelectDialog = new SelectFileDropdown('#layerTileset', Config.api.browse, 'images')
    this.entities = new EditEntities($('#layerEntities'))
    
    $('#layers').sortable({
      update: this.reorderLayers.bind(this),
    })
    $('#layers').disableSelection()
    this.resetModified()
    
    
    // Events/Input
    if (Config.touchScroll) {
      // Setup mousewheel event
      IG.instance.system.canvas.addEventListener('mousewheel', this.touchScroll.bind(this), false)

      // Unset MWHEEL_* binds
      delete Config.binds['MWHEEL_UP']
      delete Config.binds['MWHEEL_DOWN']
    }

    for (var key in Config.binds) {
      IG.instance.input.bind(EventedInput.KEY[key], Config.binds[key])
    }
    IG.instance.input.keydownCallback = this.keydown.bind(this)
    IG.instance.input.keyupCallback = this.keyup.bind(this)
    IG.instance.input.mousemoveCallback = this.mousemove.bind(this)
    
    $(window).resize(this.resize.bind(this))
    $(window).bind('keydown', this.uikeydown.bind(this))
    $(window).bind('beforeunload', this.confirmClose.bind(this))
  
    $('#buttonAddLayer').bind('click', this.addLayer.bind(this))
    $('#buttonRemoveLayer').bind('click', this.deleteLayerDialog.open.bind(this.deleteLayerDialog))
    $('#buttonSaveLayerSettings').bind('click', this.saveLayerSettings.bind(this))
    $('#reloadImages').bind('click', Image.reloadCache)
    $('#layerIsCollision').bind('change', this.toggleCollisionLayer.bind(this))
    
    $('input#toggleSidebar').click(function() {
      $('div#menu').slideToggle('fast')
      $('input#toggleSidebar').toggleClass('active')
    })
    
    // Always unfocus current input field when clicking the canvas
    $('#canvas').mousedown(function(){
      $('input:focus').blur()
    })
    
    
    this.undo = new Undo(Config.undoLevels)
    
    
    if (Config.loadLastLevel) {
      var path = $.cookie('wmLastLevel')
      if (path) {
        this.load(null, path)
      }
    }
    
    IG.instance.setAnimation(this.drawIfNeeded.bind(this)) // cdreier
  }
  
  uikeydown(event) {
    if (event.target.type == 'text') {
      return
    }
    
    var key = String.fromCharCode(event.which)
    if (key.match(/^\d$/)) {
      var index = parseInt(key)
      var name = $('#layers div.layer:nth-child(' + index + ') span.name').text()
      
      var layer = name == 'entities'
        ? this.entities
        : this.getLayerWithName(name)
        
      if (layer) {
        if (event.shiftKey) {
          layer.toggleVisibility()
        } else {
          this.setActiveLayer(layer.name)
        }
      }
    }
  }
  
  
  showLoadDialog() {
    if (this.modified) {
      this.loseChangesDialog.onOk = this.loadDialog.open.bind(this.loadDialog)
      this.loseChangesDialog.open()
    } else {
      this.loadDialog.open()
    }
  }
  
  showNewDialog() {
    if (this.modified) {
      this.loseChangesDialog.onOk = this.loadNew.bind(this)
      this.loseChangesDialog.open()
    } else {
      this.loadNew()
    }
  }
  
  setModified() {
    if (!this.modified) {
      this.modified = true
      this.setWindowTitle()
    }
  }
  
  resetModified() {
    this.modified = false
    this.setWindowTitle()
  }
  
  setWindowTitle() {
    document.title = this.fileName + (this.modified ? ' * ' : ' - ') + 'Weltmeister'
    $('span.headerTitle').text(this.fileName)
    $('span.unsavedTitle').text(this.modified ? '*' : '')
  }
  
  
  confirmClose(event) {
    var rv = undefined
    if (this.modified && Config.askBeforeClose) {
      rv = 'There are some unsaved changes. Leave anyway?'
    }
    event.returnValue = rv
    return rv
  }
  
  
  resize() {
    IG.instance.system.resize(
      Math.floor(Weltmeister.getMaxWidth() / Config.view.zoom), 
      Math.floor(Weltmeister.getMaxHeight() / Config.view.zoom), 
      Config.view.zoom
    )
    IG.instance.system.context.textBaseline = 'top'
    IG.instance.system.context.font = Config.labels.font
    this.draw()
  }
  
  scroll(x, y) {
    this.screen.x -= x
    this.screen.y -= y

    this._rscreen.x = Math.round(this.screen.x * IG.instance.system.scale) / IG.instance.system.scale
    this._rscreen.y = Math.round(this.screen.y * IG.instance.system.scale) / IG.instance.system.scale
    for (var i = 0; i < this.layers.length; i++) {
      this.layers[i].setScreenPos(this.screen.x, this.screen.y)
    }
  }
  
  drag() {
    var dx = IG.instance.input.mouse.x - this.mouseLast.x,
      dy = IG.instance.input.mouse.y - this.mouseLast.y
    this.scroll(dx, dy)
  }

  touchScroll(event) {
    event.preventDefault()

    this.scroll(event.wheelDeltaX / IG.instance.system.scale, event.wheelDeltaY / IG.instance.system.scale)
    this.draw()
    return false
  }

  zoom(delta) {
    var z = Config.view.zoom
    var mx = IG.instance.input.mouse.x * z,
      my = IG.instance.input.mouse.y * z
    
    if (z <= 1) {
      if (delta < 0) {
        z /= 2
      } else {
        z *= 2
      }
    } else {
      z += delta
    }
    
    Config.view.zoom = z.limit(Config.view.zoomMin, Config.view.zoomMax)
    Config.labels.step = Math.round(this.labelsStep / Config.view.zoom)
    $('#zoomIndicator').text(Config.view.zoom + 'x').stop(true, true).show().delay(300).fadeOut()
    
    // Adjust mouse pos and screen coordinates
    IG.instance.input.mouse.x = mx / Config.view.zoom
    IG.instance.input.mouse.y = my / Config.view.zoom
    this.drag()
    
    for (var i in Image.cache) {
      if (!i){
        console.warn('skipping Image in image cache, no path set')
        continue
      }
      Image.cache[i].resize(Config.view.zoom)
    }
    
    this.resize()
  }
  
  
  // -------------------------------------------------------------------------
  // Loading
  
  loadNew() {
    $.cookie('wmLastLevel', null)
    while (this.layers.length) {
      this.layers[0].destroy()
      this.layers.splice(0, 1)
    }
    this.screen = {x: 0, y: 0}
    this.entities.clear()
    this.fileName = 'untitled.js'
    this.filePath = Config.project.levelPath + 'untitled.js'
    this.levelData = {}
    this.saveDialog.setPath(this.filePath)
    this.resetModified()
    this.draw()
  }
  
  
  load(dialog, path) {
    this.filePath = path
    this.saveDialog.setPath(path)
    this.fileName = path.replace(/^.*\//, '')
    
    var req = $.ajax({
      url: (path + '?nocache=' + Math.random()), 
      dataType: 'text',
      async: false,
      success: this.loadResponse.bind(this),
      error() {
        $.cookie('wmLastLevel', null) 
      },
    })
  }
  
  
  loadResponse(data) {
    $.cookie('wmLastLevel', this.filePath)
    
    // extract JSON from a module's JS
    var jsonMatch = data.match(/\/\*JSON\[\*\/([\s\S]*?)\/\*\]JSON\*\//)
    data = JSON.parse(jsonMatch ? jsonMatch[1] : data)
    this.levelData = data
    
    while (this.layers.length) {
      this.layers[0].destroy()
      this.layers.splice(0, 1)
    }
    this.screen = {x: 0, y: 0}
    this.entities.clear()
    
    for (var i = 0; i < data.entities.length; i++) {
      var ent = data.entities[i]
      this.entities.spawnEntity(ent.type, ent.x, ent.y, ent.settings)
    }
    
    for (var i = 0; i < data.layer.length; i++) {
      var ld = data.layer[i]
      var newLayer = new EditMap(ld.name, ld.tilesize, ld.tilesetName, !!ld.foreground)
      newLayer.resize(ld.width, ld.height)
      newLayer.linkWithCollision = ld.linkWithCollision
      newLayer.repeat = ld.repeat
      newLayer.preRender = !!ld.preRender
      newLayer.distance = ld.distance
      newLayer.visible = !ld.visible
      newLayer.data = ld.data
      newLayer.toggleVisibility()
      this.layers.push(newLayer)
      
      if (ld.name == 'collision') {
        this.collisionLayer = newLayer
      }
      
      this.setActiveLayer(ld.name)
    }
    
    this.setActiveLayer('entities')
    
    this.reorderLayers()
    $('#layers').sortable('refresh')
    
    this.resetModified()
    this.undo.clear()
    this.draw()
  }
  
  
  
  // -------------------------------------------------------------------------
  // Saving
  
  saveQuick() {
    if (this.fileName == 'untitled.js') {
      this.saveDialog.open()
    } else {
      this.save(null, this.filePath)
    }
  }
  
  save(dialog, path) {
    if (!path.match(/\.js$/)) {
      path += '.js'
    }
    
    this.filePath = path
    this.fileName = path.replace(/^.*\//, '')
    var data = this.levelData
    data.entities = this.entities.getSaveData()
    data.layer = []
    
    var resources = []
    for (var i = 0; i < this.layers.length; i++) {
      var layer = this.layers[i]
      data.layer.push(layer.getSaveData())
      if (layer.name != 'collision') {
        resources.push(layer.tiles.path)
      }
    }
    
    
    var dataString = JSON.stringify(data)
    if (Config.project.prettyPrint) {
      dataString = JSONFormat(dataString)
    }
    
    // Make it an ig.module instead of plain JSON?
    if (Config.project.outputFormat == 'module') {
      var levelModule = path
        .replace(Config.project.modulePath, '')
        .replace(/\.js$/, '')
        .replace(/\//g, '.')
        
      var levelName = levelModule.replace(/(^.*\.|-)(\w)/g, function(m, s, a) {
        return a.toUpperCase()
      })
      
      
      var resourcesString = ''
      if (resources.length) {
        resourcesString = 'Level' + levelName + 'Resources=[new Image(\'' +
          resources.join('\'), new Image(\'') +
        '\')];\n'
      }
      
      // TODO cdreier
      // Collect all Entity Modules
      var requires = ['impact.image']
      var requiresHash = {}
      for (var i = 0; i < data.entities.length; i++) {
        var ec = this.entities.entityClasses[data.entities[i].type]
        if (!requiresHash[ec]) {
          requiresHash[ec] = true
          requires.push(ec)
        }
      }
      
      // include /*JSON[*/ ... /*]JSON*/ markers, so we can easily load
      // this level as JSON again
      dataString =
        'ig.module( \'' + levelModule + '\' )\n' +
        '.requires( \'' + requires.join('\',\'') + '\' )\n' +
        '.defines(function(){\n' +
          'Level' + levelName + '=' +
            '/*JSON[*/' + dataString + '/*]JSON*/' +
          ';\n' +
          resourcesString +
        '});'
    }
    
    var postString = 
      'path=' + encodeURIComponent(path) +
      '&data=' + encodeURIComponent(dataString)
    
    var req = $.ajax({
      url: Config.api.save,
      type: 'POST',
      dataType: 'json',
      async: false,
      data: postString,
      success: this.saveResponse.bind(this),
    })
  }
  
  saveResponse(data) {
    if (data.error) {
      alert('Error: ' + data.msg)
    } else {
      this.resetModified()
      $.cookie('wmLastLevel', this.filePath)
    }
  }
  
  
  
  // -------------------------------------------------------------------------
  // Layers
  
  addLayer() {
    var name = 'new_layer_' + this.layers.length
    var newLayer = new EditMap(name, Config.layerDefaults.tilesize)
    newLayer.resize(Config.layerDefaults.width, Config.layerDefaults.height)
    newLayer.setScreenPos(this.screen.x, this.screen.y)
    this.layers.push(newLayer)
    this.setActiveLayer(name)
    this.updateLayerSettings()
    
    this.reorderLayers()
    
    $('#layers').sortable('refresh')
  }
  
  
  removeLayer() {
    var name = this.activeLayer.name
    if (name == 'entities') {
      return false
    }
    this.activeLayer.destroy()
    for (var i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name == name) {
        this.layers.splice(i, 1)
        this.reorderLayers()
        $('#layers').sortable('refresh')
        this.setActiveLayer('entities')
        return true
      }
    }
    return false
  }
  
  
  getLayerWithName(name) {
    for (var i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name == name) {
        return this.layers[i]
      }
    }
    return null
  }
  
  
  reorderLayers(dir) {
    var newLayers = []
    var isForegroundLayer = true
    $('#layers div.layer span.name').each((function(newIndex, span){
      var name = $(span).text()
      
      var layer = name == 'entities'
        ? this.entities
        : this.getLayerWithName(name)
        
      if (layer) {
        layer.setHotkey(newIndex + 1)
        if (layer.name == 'entities') {
          // All layers after the entity layer are not foreground
          // layers
          isForegroundLayer = false
        } else {
          layer.foreground = isForegroundLayer
          newLayers.unshift(layer)
        }
      }
    }).bind(this))
    this.layers = newLayers
    this.setModified()
    this.draw()
  }
  
  
  updateLayerSettings() {
    $('#layerName').val(this.activeLayer.name)
    $('#layerTileset').val(this.activeLayer.tilesetName)
    $('#layerTilesize').val(this.activeLayer.tilesize)
    $('#layerWidth').val(this.activeLayer.width)
    $('#layerHeight').val(this.activeLayer.height)
    $('#layerPreRender').prop('checked', this.activeLayer.preRender)
    $('#layerRepeat').prop('checked', this.activeLayer.repeat)
    $('#layerLinkWithCollision').prop('checked', this.activeLayer.linkWithCollision)
    $('#layerDistance').val(this.activeLayer.distance)
  }
  
  
  saveLayerSettings() {
    var isCollision = $('#layerIsCollision').prop('checked')
    
    var newName = $('#layerName').val()
    var newWidth = Math.floor($('#layerWidth').val())
    var newHeight = Math.floor($('#layerHeight').val())
    
    if (newWidth != this.activeLayer.width || newHeight != this.activeLayer.height) {
      this.activeLayer.resize(newWidth, newHeight)
    }
    this.activeLayer.tilesize = Math.floor($('#layerTilesize').val())
    
    if (isCollision) {
      newName = 'collision'
      this.activeLayer.linkWithCollision = false
      this.activeLayer.distance = 1
      this.activeLayer.repeat = false
      this.activeLayer.setCollisionTileset()
    } else {
      var newTilesetName = $('#layerTileset').val()
      if (newTilesetName != this.activeLayer.tilesetName) {
        this.activeLayer.setTileset(newTilesetName)
      }
      this.activeLayer.linkWithCollision = $('#layerLinkWithCollision').prop('checked')
      this.activeLayer.distance = $('#layerDistance').val()
      this.activeLayer.repeat = $('#layerRepeat').prop('checked')
      this.activeLayer.preRender = $('#layerPreRender').prop('checked')
    }
    
    
    if (newName == 'collision') {
      // is collision layer
      this.collisionLayer = this.activeLayer
    } else if (this.activeLayer.name == 'collision') {
      // was collision layer, but is no more
      this.collisionLayer = null
    }
    

    this.activeLayer.setName(newName)
    this.setModified()
    this.draw()
  }
  
  
  setActiveLayer(name) {
    var previousLayer = this.activeLayer
    this.activeLayer = (name == 'entities' ? this.entities : this.getLayerWithName(name))
    if (previousLayer == this.activeLayer) {
      return // nothing to do here
    }
    
    if (previousLayer) {
      previousLayer.setActive(false)
    }
    this.activeLayer.setActive(true)
    this.mode = Weltmeister.MODE.DEFAULT
    
    $('#layerIsCollision').prop('checked', (name == 'collision'))
    
    if (name == 'entities') {
      $('#layerSettings').fadeOut(100)
    } else {
      this.entities.selectEntity(null)
      this.toggleCollisionLayer()
      $('#layerSettings')
        .fadeOut(100, this.updateLayerSettings.bind(this))
        .fadeIn(100)
    }
    this.draw()
  }
  
  
  toggleCollisionLayer(ev) {
    var isCollision = $('#layerIsCollision').prop('checked')
    $('#layerLinkWithCollision,#layerDistance,#layerPreRender,#layerRepeat,#layerName,#layerTileset')
      .attr('disabled', isCollision)
  }
  
  
  
  // -------------------------------------------------------------------------
  // Update
  
  mousemove() {
    if (!this.activeLayer) {
      return
    }
    
    if (this.mode == Weltmeister.MODE.DEFAULT) {
      
      // scroll map
      if (IG.instance.input.state('drag')) {
        this.drag()
      } else if (IG.instance.input.state('draw')) {
        
        // move/scale entity
        if (this.activeLayer == this.entities) {
          var x = IG.instance.input.mouse.x + this.screen.x
          var y = IG.instance.input.mouse.y + this.screen.y
          this.entities.dragOnSelectedEntity(x, y)
          this.setModified()
        }
        
        // draw on map
        else if (!this.activeLayer.isSelecting) {
          this.setTileOnCurrentLayer()
        }
      } else if (this.activeLayer == this.entities) {
        var x = IG.instance.input.mouse.x + this.screen.x
        var y = IG.instance.input.mouse.y + this.screen.y
        this.entities.mousemove(x, y)
      }
    }
    
    this.mouseLast = {x: IG.instance.input.mouse.x, y: IG.instance.input.mouse.y}
    this.draw()
  }
  
  
  keydown(action) {
    if (!this.activeLayer) {
      return
    }
    
    if (action == 'draw') {
      if (this.mode == Weltmeister.MODE.DEFAULT) {
        // select entity
        if (this.activeLayer == this.entities) {
          var x = IG.instance.input.mouse.x + this.screen.x
          var y = IG.instance.input.mouse.y + this.screen.y
          var entity = this.entities.selectEntityAt(x, y)
          if (entity) {
            this.undo.beginEntityEdit(entity)
          }
        } else if (IG.instance.input.state('select')) {
          this.activeLayer.beginSelecting(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
        } else {
          this.undo.beginMapDraw()
          this.activeLayer.beginEditing()
          if ( 
            this.activeLayer.linkWithCollision && 
              this.collisionLayer && 
              this.collisionLayer != this.activeLayer
          ) {
            this.collisionLayer.beginEditing()
          }
          this.setTileOnCurrentLayer()
        }
      } else if (this.mode == Weltmeister.MODE.TILESELECT && IG.instance.input.state('select')) {	
        this.activeLayer.tileSelect.beginSelecting(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
      }
    }
    
    this.draw()
  }
  
  
  keyup(action) {
    if (!this.activeLayer) {
      return
    }
    
    if (action == 'delete') {
      this.entities.deleteSelectedEntity()
      this.setModified()
    } else if (action == 'clone') {
      this.entities.cloneSelectedEntity()
      this.setModified()
    } else if (action == 'grid') {
      Config.view.grid = !Config.view.grid
    } else if (action == 'menu') {
      if (this.mode != Weltmeister.MODE.TILESELECT && this.mode != Weltmeister.MODE.ENTITYSELECT) {
        if (this.activeLayer == this.entities) {
          this.mode = Weltmeister.MODE.ENTITYSELECT
          this.entities.showMenu(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
        } else {
          this.mode = Weltmeister.MODE.TILESELECT
          this.activeLayer.tileSelect.setPosition(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
        }
      } else {
        this.mode = Weltmeister.MODE.DEFAULT
        this.entities.hideMenu()
      }
    } else if (action == 'zoomin') {
      this.zoom(1)
    } else if (action == 'zoomout') {
      this.zoom(-1)
    }
    
    
    if (action == 'draw') {			
      // select tile
      if (this.mode == Weltmeister.MODE.TILESELECT) {
        this.activeLayer.brush = this.activeLayer.tileSelect.endSelecting(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
        this.mode = Weltmeister.MODE.DEFAULT
      } else if (this.activeLayer == this.entities) {
        this.undo.endEntityEdit()
      } else if (this.activeLayer.isSelecting) {
        this.activeLayer.brush = this.activeLayer.endSelecting(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
      } else {
        this.undo.endMapDraw()
      }
    }
    
    if (action == 'undo') {
      this.undo.undo()
    }
    
    if (action == 'redo') {
      this.undo.redo()
    }
    
    this.draw()
    this.mouseLast = {x: IG.instance.input.mouse.x, y: IG.instance.input.mouse.y}
  }
  
  
  setTileOnCurrentLayer() {
    if (!this.activeLayer || !this.activeLayer.scroll) {
      return
    }
    
    var co = this.activeLayer.getCursorOffset()
    var x = IG.instance.input.mouse.x + this.activeLayer.scroll.x - co.x
    var y = IG.instance.input.mouse.y + this.activeLayer.scroll.y - co.y
    
    var brush = this.activeLayer.brush
    for (var by = 0; by < brush.length; by++) {
      var brushRow = brush[by]
      for (var bx = 0; bx < brushRow.length; bx++) {
        
        var mapx = x + bx * this.activeLayer.tilesize
        var mapy = y + by * this.activeLayer.tilesize
        
        var newTile = brushRow[bx]
        var oldTile = this.activeLayer.getOldTile(mapx, mapy)
        
        this.activeLayer.setTile(mapx, mapy, newTile)
        this.undo.pushMapDraw(this.activeLayer, mapx, mapy, oldTile, newTile)
        
        
        if ( 
          this.activeLayer.linkWithCollision && 
          this.collisionLayer && 
          this.collisionLayer != this.activeLayer
        ) {
          var collisionLayerTile = newTile > 0 ? this.collisionSolid : 0
          
          var oldCollisionTile = this.collisionLayer.getOldTile(mapx, mapy)
          this.collisionLayer.setTile(mapx, mapy, collisionLayerTile)
          this.undo.pushMapDraw(this.collisionLayer, mapx, mapy, oldCollisionTile, collisionLayerTile)
        }
      }
    }
    
    this.setModified()
  }
  
  
  // -------------------------------------------------------------------------
  // Drawing
  
  draw() {
    // The actual drawing loop is scheduled via ig.setAnimation() already.
    // We just set a flag to indicate that a redraw is needed.
    this.needsDraw = true
  }
  
  
  drawIfNeeded() {
    // Only draw if flag is set
    if (!this.needsDraw) {
      return 
    }
    this.needsDraw = false
    
    
    IG.instance.system.clear(Config.colors.clear)
  
    var entitiesDrawn = false
    for (var i = 0; i < this.layers.length; i++) {
      var layer = this.layers[i]
      
      // This layer is a foreground layer? -> Draw entities first!
      if (!entitiesDrawn && layer.foreground) {
        entitiesDrawn = true
        this.entities.draw()
      }
      layer.draw()
    }
    
    if (!entitiesDrawn) {
      this.entities.draw()
    }
    
    
    if (this.activeLayer) {
      if (this.mode == Weltmeister.MODE.TILESELECT) {
        this.activeLayer.tileSelect.draw()
        this.activeLayer.tileSelect.drawCursor(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
      }
      
      if (this.mode == Weltmeister.MODE.DEFAULT) {
        this.activeLayer.drawCursor(IG.instance.input.mouse.x, IG.instance.input.mouse.y)
      }
    }
    
    if (Config.labels.draw) {
      this.drawLabels(Config.labels.step)
    }
  }
  
  
  drawLabels(step) {
    IG.instance.system.context.fillStyle = Config.colors.primary
    var xlabel = this.screen.x - this.screen.x % step - step
    for (var tx = Math.floor(-this.screen.x % step); tx < IG.instance.system.width; tx += step) {
      xlabel += step
      IG.instance.system.context.fillText(xlabel, tx * IG.instance.system.scale, 0)
    }
    
    var ylabel = this.screen.y - this.screen.y % step - step
    for (var ty = Math.floor(-this.screen.y % step); ty < IG.instance.system.height; ty += step) {
      ylabel += step
      IG.instance.system.context.fillText(ylabel, 0, ty * IG.instance.system.scale)
    }
  }
  
  
  getEntityByName(name) {
    return this.entities.getEntityByName(name)
  }
}



// Custom ig.Image class for use in Weltmeister. To make the zoom function 
// work, we need some additional scaling behavior:
// Keep the original image, maintain a cache of scaled versions and use the 
// default Canvas scaling (~bicubic) instead of nearest neighbor when 
// zooming out.
class Image extends ImpactImage {

  resize(scale) {
    if (!this.loaded) {
      return 
    }
    if (!this.scaleCache) {
      this.scaleCache = {} 
    }
    if (this.scaleCache['x' + scale]) {
      this.data = this.scaleCache['x' + scale]
      return
    }
    
    // Retain the original image when scaling
    this.origData = this.data = this.origData || this.data
    
    if (scale > 1) {
      // Nearest neighbor when zooming in
      this.parent(scale)
    } else {
      // Otherwise blur
      var scaled = ig.$new('canvas')
      scaled.width = Math.ceil(this.width * scale)
      scaled.height = Math.ceil(this.height * scale)
      var scaledCtx = scaled.getContext('2d')
      scaledCtx.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, scaled.width, scaled.height)
      this.data = scaled
    }
    
    this.scaleCache['x' + scale] = this.data
  }
}



// Create a custom loader, to skip sound files and the run loop creation
export class WMLoader extends Loader {

  end() {
    if (this.done) {
      return 
    }
    
    clearInterval(this._intervalId)
    this.done = true
    IG.instance.system.clear(Config.colors.clear)
    IG.instance.game = new (this.gameClass)()
  }
  
  loadResource(res) {
    if (res instanceof Sound) {
      this._unloaded.erase(res.path)
    } else {
      this.parent(res)
    }
  }

}

export default Weltmeister

// // Define a dummy module to load all plugins
// ig.module('weltmeister.loader').requires.apply(ig, Config.plugins).defines(function(){
// 	// Init!
  
// }




// IG.createInstance('#canvas', MyGame, 60, 320, 240, 2)

// const ig = {
// 	system: wmSystem, 
// 	input: ,
// 	soundManager: ,
// 	ready: true,
// 	resources: [],
// }

// var loader = new WMLoader( ig.system, Weltmeister, ig.resources );
// loader.load();