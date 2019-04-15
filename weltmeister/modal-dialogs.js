import SelectFileDropdown from './select-file-dropdown'
import Config from './config'

class ModalDialog {
  onOk = null
  onCancel = null

  text = ''
  okText = ''
  cancelText = ''
  
  background = null
  dialogBox = null
  buttonDiv = null
  
  constructor(text, okText, cancelText) {
    this.text = text
    this.okText = okText || 'OK'
    this.cancelText = cancelText || 'Cancel'
  
    this.background = $('<div/>', {'class': 'modalDialogBackground'})
    this.dialogBox = $('<div/>', {'class': 'modalDialogBox'})
    this.background.append(this.dialogBox)
    $('body').append(this.background)
    
    this.initDialog(text)
  }
  
  
  initDialog() {
    this.buttonDiv = $('<div/>', {'class': 'modalDialogButtons'})
    var okButton = $('<input/>', {'type': 'button', 'class': 'button', 'value': this.okText})
    var cancelButton = $('<input/>', {'type': 'button', 'class': 'button', 'value': this.cancelText})
    
    okButton.bind('click', this.clickOk.bind(this))
    cancelButton.bind('click', this.clickCancel.bind(this))
    
    this.buttonDiv.append(okButton).append(cancelButton)
    
    this.dialogBox.html('<div class="modalDialogText">' + this.text + '</div>')
    this.dialogBox.append(this.buttonDiv)
  }
  
  
  clickOk() {
    if (this.onOk) {
      this.onOk(this) 
    }
    this.close()
  }
  
  
  clickCancel() {
    if (this.onCancel) {
      this.onCancel(this) 
    }
    this.close()
  }
  
  
  open() {
    this.background.fadeIn(100)
  }
  
  
  close() {
    this.background.fadeOut(100)
  }
}



class ModalDialogPathSelect extends ModalDialog {
  pathDropdown = null
  pathInput = null
  fileType = ''

  // bums = new Date().getTime()
  
  constructor(text, okText, type) {
    super(text, (okText || 'Select'))
    // console.log("super done", this.pathInput, this.bums)
    this.fileType = type || ''
    this.initDialog(text)
  }
  
  
  setPath(path) {
    var dir = path.replace(/\/[^\/]*$/, '')
    // console.log("set path", this.pathInput, this.bums)
    this.pathInput.val(path)
    this.pathDropdown.loadDir(dir)
  }
  
  initDialog() {
    super.initDialog()
    this.pathInput = $('<input/>', {'type': 'text', 'class': 'modalDialogPath'})
    // console.log("init dialog", this.pathInput, this.bums)
    this.buttonDiv.before(this.pathInput)
    this.pathDropdown = new SelectFileDropdown(this.pathInput, Config.api.browse, this.fileType)
  }
  
  clickOk() {
    if (this.onOk) { 
      this.onOk(this, this.pathInput.val()) 
    }
    this.close()
  }
}

export default ModalDialog

export {
  ModalDialogPathSelect,
}