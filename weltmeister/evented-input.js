import {Input} from 'impact'

class EventedInput extends Input {

  mousemoveCallback = null
  keyupCallback = null
  keydownCallback = null
  
  delayedKeyup = {push: function(){}, length: 0}
  
  
  constructor(system){
    super(system)
  }

  keydown(event) {
    var tag = event.target.tagName
    if (tag == 'INPUT' || tag == 'TEXTAREA') {
      return 
    }
    
    var code = event.type == 'keydown' 
      ? event.keyCode 
      : (event.button == 2 ? Input.KEY.MOUSE2 : Input.KEY.MOUSE1)
    var action = this.bindings[code]
    if (action) {
      if (!this.actions[action]) {
        this.actions[action] = true
        if (this.keydownCallback) {
          this.keydownCallback(action)
        }
      }
      event.stopPropagation()
      event.preventDefault()
    }
  }
  
  
  keyup(event) {
    var tag = event.target.tagName
    if (tag == 'INPUT' || tag == 'TEXTAREA') {
      return 
    }
    
    var code = event.type == 'keyup' 
      ? event.keyCode 
      : (event.button == 2 ? Input.KEY.MOUSE2 : Input.KEY.MOUSE1)
    var action = this.bindings[code]
    if (action) {
      this.actions[action] = false
      if (this.keyupCallback) {
        this.keyupCallback(action)
      }
      event.stopPropagation()
      event.preventDefault()
    }
  }
  
  
  mousewheel(event) {
    var delta = event.wheelDelta ? event.wheelDelta : (event.detail * -1)
    var code = delta > 0 ? Input.KEY.MWHEEL_UP : Input.KEY.MWHEEL_DOWN
    var action = this.bindings[code]
    if (action) {
      if (this.keyupCallback) {
        this.keyupCallback(action)
      }
      event.stopPropagation()
      event.preventDefault()
    }
  }
  
  
  mousemove(event) {
    super.mousemove(event)
    if (this.mousemoveCallback) {
      this.mousemoveCallback()
    }
  }
}

export default EventedInput