# Impact

Impact is an HTML5 Game Engine. More info & documentation: http://impactjs.com/

Various example games to get you started are available on http://impactjs.com/download

Impact is published under the [MIT Open Source License](http://opensource.org/licenses/mit-license.php). Note that Weltmeister (Impact's level editor) uses jQuery which comes with its own license.

## longe time ago...

i found impact, and loved it to make games with.

now, impact is open source - and i tried to bring it to 2018, to the shiny new javascript world

## Kick it off

![demo gif](https://raw.githubusercontent.com/cdreier/Impact/master/demo/impact-intro-sm.gif)

To make it as easy as possible, i created a small CLI binary to get you up and running in no time. 

Grab it from the [release page](https://github.com/cdreier/Impact/releases/latest)

to create a new project, just run the CLI with the `-new` flag

`./Impact-vXXX -new`

this bootstraps a new impact game project in your current folder.

now you install all the dev-dependencies with `npm install`. 

> **IMPORTANT note**
> 
>i completely removed the ig.module system and replaced it with native javascript classes - but this classes are transpiled with webpack and babel - and webpack only loads classes that are referenced in your code.
>
> to get everything working properly (also in weltmeister), my first idea was to generate a file, that loads all entities - this is doing the CLI for you.

### cli

the cli is for 2 reasons important:

* it starts a local webserver where the weltmeister api is running
* it generates the entity file for weltmeister

### webpack

as everything is generated, we can start webpack with `npm start` (webpack serves the game and weltmeister bundle)

the impact game is running on http://localhost:8080

weltmeister is running on http://localhost:8081

the entry-point is the `index.js` file

```js
import {IG, Debug} from 'impact'
import MyGame from './game/main'
import './entities.generated'

const instance = IG.createInstance('#canvas', MyGame, 60, 320, 240, 2)
Debug.createDebugger(instance)
```

the game code lives in the `game` directory, where webpack watches for changes and auto reloads the browser

## Entities

i left a demo entity in the generated code, everything is working now with es6 imports and native classes

```js
import {Entity, IG, AnimationSheet} from 'impact'

class PlayerEntity extends Entity {

  constructor(x, y, settings){
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/player.png', 16, 20)

    this.friction.x = 20
    this.gravityFactor = 10

    this.addAnim('idle', 0.1, [0])
    this.addAnim('jump', 0.1, [1, 2])

  }

  update(){
    super.update()
    if (IG.instance.input.pressed('jump')){
      this.currentAnim = this.anims['jump']
      this.vel.y -= 50
    }
  }

}

export default PlayerEntity
```

the api surface of all the classes are not changed, so most of the impact documentation is still a good place to read and learn :)

## weltmeister levels

weltmeister should just work - but the generated code fully relies on the ig.modules

so i write an additional json file with alle the level data. To load the level you can just require it in your code and use it 

```js
const levelData = require('./levels/awesomeLevel.json')

class MyGame extends Game {

  constructor(){
    this.loadLevel(levelData)
  }
}
```


## pack it together

webpack can bundle everything in one single javascript bundle, just run `npm run build`

your game bundle is now in the `dist` folder


## CLI flags

```
Usage of ./Impact-v0.0.2-linux-amd64:
  -b2d
    	only works with new flag, bootstraps a box2d game instead default impact game
  -game string
    	the name of the game-folder (default "game")
  -igserver string
    	impact webpack server url (default "http://localhost:8080")
  -new
    	start with --new flag to bootstrap new game
  -port string
    	the port to start weltmeister on (default "8081")
  -root string
    	the file root you start weltmeister (default "./")
```
