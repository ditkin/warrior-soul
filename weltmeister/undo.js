import {IG} from 'impact'

class Undo {

  static MAP_DRAW = 1;
  static ENTITY_EDIT = 2;
  static ENTITY_CREATE = 3;
  static ENTITY_DELETE = 4;

  levels = 10
  chain = []
  rpos = 0
  currentAction = null
  
  constructor(levels) {
    this.levels = levels || 10
  }
  
  
  clear() {
    this.chain = []
    this.currentAction = null
  }
  
  
  commit(action) {
    if (this.rpos) {
      this.chain.splice(this.chain.length - this.rpos, this.rpos)
      this.rpos = 0
    }
    action.activeLayer = IG.instance.game.activeLayer ? IG.instance.game.activeLayer.name : ''
    this.chain.push(action)
    if (this.chain.length > this.levels) {
      this.chain.shift()
    }
  }
  
  
  undo() {
    var action = this.chain[this.chain.length - this.rpos - 1]
    if (!action) {
      return
    }
    this.rpos++
    
    
    IG.instance.game.setActiveLayer(action.activeLayer)
    
    if (action.type == Undo.MAP_DRAW) {
      for (var i = 0; i < action.changes.length; i++) {
        var change = action.changes[i]
        change.layer.setTile(change.x, change.y, change.old)
      }
    } else if (action.type == Undo.ENTITY_EDIT) {
      action.entity.pos.x = action.old.x
      action.entity.pos.y = action.old.y
      action.entity.size.x = action.old.w
      action.entity.size.y = action.old.h
      IG.instance.game.entities.selectEntity(action.entity)
      IG.instance.game.entities.loadEntitySettings()
    } else if (action.type == Undo.ENTITY_CREATE) {
      IG.instance.game.entities.removeEntity(action.entity)
      IG.instance.game.entities.selectEntity(null)
    } else if (action.type == Undo.ENTITY_DELETE) {
      IG.instance.game.entities.entities.push(action.entity)
      if (action.entity.name) {
        this.namedEntities[action.entity.name] = action.entity
      }
      IG.instance.game.entities.selectEntity(action.entity)
    }
    
    IG.instance.game.setModified()
  }
  
  
  redo() {
    if (!this.rpos) {
      return
    }
    
    var action = this.chain[this.chain.length - this.rpos]
    if (!action) {
      return
    }
    this.rpos--
    
    
    IG.instance.game.setActiveLayer(action.activeLayer)
    
    if (action.type == Undo.MAP_DRAW) {
      for (var i = 0; i < action.changes.length; i++) {
        var change = action.changes[i]
        change.layer.setTile(change.x, change.y, change.current)
      }
    } else if (action.type == Undo.ENTITY_EDIT) {
      action.entity.pos.x = action.current.x
      action.entity.pos.y = action.current.y
      action.entity.size.x = action.current.w
      action.entity.size.y = action.current.h
      IG.instance.game.entities.selectEntity(action.entity)
      IG.instance.game.entities.loadEntitySettings()
    } else if (action.type == Undo.ENTITY_CREATE) {
      IG.instance.game.entities.entities.push(action.entity)
      if (action.entity.name) {
        this.namedEntities[action.entity.name] = action.entity
      }
      IG.instance.game.entities.selectEntity(action.entity)
    } else if (action.type == Undo.ENTITY_DELETE) {
      IG.instance.game.entities.removeEntity(action.entity)
      IG.instance.game.entities.selectEntity(null)
    }
    
    IG.instance.game.setModified()
  }
  
  
  // -------------------------------------------------------------------------
  // Map changes
  
  beginMapDraw(layer) {
    this.currentAction = {
      type: Undo.MAP_DRAW,
      time: Date.now(),
      changes: [],
    }
  }
  
  pushMapDraw(layer, x, y, oldTile, currentTile) {
    if (!this.currentAction) {
      return
    }
    
    this.currentAction.changes.push({
      layer: layer,
      x: x,
      y: y,
      old: oldTile,
      current: currentTile,
    })
  }
  
  endMapDraw() {		
    if (!this.currentAction || !this.currentAction.changes.length) {
      return
    }
    
    this.commit(this.currentAction)		
    this.currentAction = null
  }
  
  
  // -------------------------------------------------------------------------
  // Entity changes
  
  beginEntityEdit(entity) {		
    this.currentAction = {
      type: Undo.ENTITY_EDIT,
      time: Date.now(),
      entity: entity,
      old: {
        x: entity.pos.x,
        y: entity.pos.y,
        w: entity.size.x,
        h: entity.size.y,
      },
      current: {
        x: entity.pos.x,
        y: entity.pos.y,
        w: entity.size.x,
        h: entity.size.y,
      },
    }
  }

  pushEntityEdit(entity) {		
    if (!this.currentAction) {
      return
    }
    
    this.currentAction.current = {
      x: entity.pos.x,
      y: entity.pos.y,
      w: entity.size.x,
      h: entity.size.y,
    }
  }
  
  
  endEntityEdit() {	
    var a = this.currentAction
    
    if (!a || (
      a.old.x == a.current.x && a.old.y == a.current.y &&
      a.old.w == a.current.w && a.old.h == a.current.h
    )) {
      return
    }
    
    this.commit(this.currentAction)		
    this.currentAction = null
  }
  
  
  commitEntityCreate(entity) {		
    this.commit({
      type: Undo.ENTITY_CREATE,
      time: Date.now(),
      entity: entity,
    })
  }
  
  
  commitEntityDelete(entity) {		
    this.commit({
      type: Undo.ENTITY_DELETE,
      time: Date.now(),
      entity: entity,
    })
  }
}

export default Undo