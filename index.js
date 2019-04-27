import { IG, Debug } from 'impact'
import WarriorSoulGame from './game/main'

IG.createInstance('#canvas', WarriorSoulGame, 60, 1000, 1000, 1)
//const instance = IG.createInstance('#canvas', MyGame, 60, 320, 240, 2)
// Debug.createDebugger(instance)
