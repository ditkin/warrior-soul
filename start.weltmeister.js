import {Weltmeister, WMLoader, EventedInput, Config} from 'weltmeister'
import {IG, IGConfig, System, SoundManager} from 'impact'
import './entities.generated'

// construct and start weltmeister
const wmSystem = new System(
  '#canvas', 1,
  Math.floor(Weltmeister.getMaxWidth() / Config.view.zoom),
  Math.floor(Weltmeister.getMaxHeight() / Config.view.zoom),
  Config.view.zoom
)

const igConfig = new IGConfig()
igConfig.system = wmSystem
igConfig.input = new EventedInput(wmSystem)
igConfig.soundManager = new SoundManager()

fetch(Config.api.glob)
  .then(r => r.json())
  .then(modules => {
    Weltmeister.entityModules = modules 
    IG.instance = new IG(igConfig, Weltmeister, WMLoader)
    IG.instance.global.wm = true
  })
