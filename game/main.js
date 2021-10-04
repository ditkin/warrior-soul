import IG from '../lib/impact'
import Game from '../lib/game'
import Font from '../lib/font'
import Input from '../lib/input'
import Image from '../lib/image'
import { Sound } from '../lib/sound'
import Timer from '../lib/timer'

import SlasherEntity from './SlasherEntity'
import ChiefEntity from './ChiefEntity'
import FoxEntity from './FoxEntity'
import Battlefield from './battlefield'
import Sidelines from './sidelines'

export default class WarriorSoulGame extends Game {
  // bgmusic = new Sound('media/bg.*', false)

  constructor() {
    super()

    // IG.instance.input.bind(Input.KEY.RIGHT_ARROW, 'right')
    // IG.instance.input.bind(Input.KEY.LEFT_ARROW, 'left')
    // IG.instance.input.bind(Input.KEY.UP_ARROW, 'jump')

    // this.loadLevel(data)
    // this.player = this.spawnEntity(PlayerEntity, 20, 30)

    this.gravity = 600
    this.background = new Image('media/background.jpg')
    this.bigscroll = new Image('media/bigscroll.png')
    this.scroll = new Image('media/scroll.png')

    this.battlefieldImage = new Image('media/battlefield.jpg')
    this.sidelinesImage = new Image('media/sidelines.jpg')

    this.p1choose = new Sound('media/sounds/p1choose.*')
    this.p2choose = new Sound('media/sounds/p2choose.*')
    this.stagepick = new Sound('media/sounds/stagepick.*')
    this.warriorsoul = new Sound('media/sounds/warriorsoul.*')
    this.battlef = new Sound('media/sounds/battlefield.*')
    this.sidelines = new Sound('media/sounds/sidelines.*')
    this.fight = new Sound('media/sounds/fight.*')
    this.chiefSelect = new Sound('media/sounds/chiefselect.*')
    this.kiler = new Sound('media/sounds/kiler.*')
    this.foxe = new Sound('media/sounds/foxe.*')

    this.soundplayed = false
    this.bfplayed = false
    this.sidelinesPlayed = false

    this.font = new Font('media/font.png')
    this.winner = null
    this.p1 = null
    this.p2 = null
    this.p1picked = null
    this.p2picked = null
    this.levelpicked = false
    this.spawnTimer = new Timer(1)
    this.startTimer = new Timer(0.5)
    this.scrollTimer = new Timer(1)

    this.state = 0
    this.START = 0
    this.INSTR = 1
    this.STAGE = 2
    this.CHAR1 = 3
    this.CHAR2 = 4
    this.GAME = 5
    this.GAME_OVER = 6

    IG.instance.input.bind(Input.KEY.ENTER, 'start')
    IG.instance.input.bind(Input.KEY.X, 'x')
    IG.instance.input.bind(Input.KEY._1, 'one')
    IG.instance.input.bind(Input.KEY._2, 'two')
    IG.instance.input.bind(Input.KEY._3, 'three')
    IG.instance.input.bind(Input.KEY.W, 'p1up')
    IG.instance.input.bind(Input.KEY.A, 'p1left')
    IG.instance.input.bind(Input.KEY.S, 'p1down')
    IG.instance.input.bind(Input.KEY.D, 'p1right')
    IG.instance.input.bind(Input.KEY.Q, 'p1att')
    IG.instance.input.bind(Input.KEY.E, 'p1grab')
    IG.instance.input.bind(Input.KEY.SHIFT, 'p1dodge')

    IG.instance.input.bind(Input.KEY.I, 'p2up')
    IG.instance.input.bind(Input.KEY.J, 'p2left')
    IG.instance.input.bind(Input.KEY.K, 'p2down')
    IG.instance.input.bind(Input.KEY.L, 'p2right')
    IG.instance.input.bind(Input.KEY.P, 'p2grab')
    IG.instance.input.bind(Input.KEY.O, 'p2dodge')
    IG.instance.input.bind(Input.KEY.SPACE, 'p2att')
    IG.instance.music.add('media/sounds/crazyb.*')
    IG.instance.music.add('media/sounds/getready.mp3')
    IG.instance.music.add('media/sounds/happychip.mp3')
    IG.instance.music.volume = 0.4
    IG.instance.music.play()
  }

  update() {
    super.update()
    switch (this.state) {
      case this.START:
        if (!this.soundplayed) this.warriorsoul.play()
        this.soundplayed = true
        if (IG.instance.input.state('start')) {
          this.state = 2
        } else if (IG.instance.input.state('p1att')) {
          this.state = 1
        }
        break
      //instructinoal screen.
      case this.INSTR:
        if (IG.instance.input.state('start')) {
          this.stagepick.play()
          this.state++
        }
        break
      case this.STAGE:
        if (IG.instance.input.state('p1att')) {
          if (!this.bfplayed) this.battlef.play()
          this.bfplayed = true
          this.loadLevel(Battlefield)
          this.levelpicked = true
        } else if (IG.instance.input.state('p1up')) {
          if (!this.sidelinesPlayed) this.sidelines.play()
          this.sidelinesPlayed = true
          this.loadLevel(Sidelines)
          this.levelpicked = true
        }
        if (this.levelpicked == true && IG.instance.input.state('start')) {
          this.p1choose.play()
          this.p1 = null
          this.state++
        }
        break
      case this.CHAR1:
        if (IG.instance.input.state('p1att') && this.p1 == null) {
          this.chiefSelect.play()
          this.p1 = this.spawnEntity(
            ChiefEntity,
            IG.instance.system.width / 5,
            IG.instance.system.height * 0.6,
            { entype: 'A', stocks: 4 }
          )
        }
        if (IG.instance.input.state('p1up') && this.p1 == null) {
          this.kiler.play()
          this.p1 = this.spawnEntity(
            SlasherEntity,
            IG.instance.system.width / 5,
            IG.instance.system.height * 0.6,
            { entype: 'A', stocks: 4 }
          )
        }
        if (IG.instance.input.state('p1grab') && this.p1 == null) {
          this.foxe.play()
          this.p1 = this.spawnEntity(
            FoxEntity,
            IG.instance.system.width / 5,
            IG.instance.system.height * 0.6,
            { entype: 'A', stocks: 4 }
          )
        }
        if (IG.instance.input.state('x') && this.p1 != null) {
          this.p1.kill()
          this.p1 = null
        }

        if (IG.instance.input.state('start') && this.p1 != null) {
          this.p2choose.play()
          this.p2 = null
          this.state++
        }
        break
      case this.CHAR2:
        if (IG.instance.input.state('p1att') && this.p2 == null) {
          this.chiefSelect.play()
          this.p2 = this.spawnEntity(
            ChiefEntity,
            IG.instance.system.width * 0.75,
            IG.instance.system.height * 0.6,
            { entype: 'B', stocks: 4 }
          )
          this.p2.currentAnim.flip.x
        }
        if (IG.instance.input.state('p1up') && this.p2 == null) {
          this.kiler.play()
          this.p2 = this.spawnEntity(
            SlasherEntity,
            IG.instance.system.width * 0.75,
            IG.instance.system.height * 0.6,
            { entype: 'B', stocks: 4 }
          )
          this.p2.currentAnim.flip.x
        }
        if (IG.instance.input.state('p1grab') && this.p2 == null) {
          this.foxe.play()
          this.p2 = this.spawnEntity(
            FoxEntity,
            IG.instance.system.width * 0.75,
            IG.instance.system.height * 0.6,
            { entype: 'B', stocks: 4 }
          )
        }
        if (IG.instance.input.state('x') && this.p2 != null) {
          this.p2.kill()
          this.p2 = null
        }
        if (IG.instance.input.state('start') && this.p2 != null) {
          this.fight.play()
          this.state++
        }
        break
      case this.GAME_OVER:
        if (IG.instance.input.state('start')) {
          this.p1.kill()
          this.p2.kill()
          this.levelpicked = false
          this.state = this.START
          this.soundplayed = false
          this.bfplayed = false
          this.sidelinesPlayed = false
        }
        break
    }
  }

  draw() {
    super.draw()

    switch (this.state) {
      case this.START:
        this.background.draw(0, 0)
        this.scroll.draw(
          (IG.instance.system.width * 1) / 4,
          IG.instance.system.height * 0.4
        )
        this.font.draw(
          'WARRIOR SOUL!',
          IG.instance.system.width * 0.4,
          IG.instance.system.height / 2
        )
        this.font.draw(
          'by David Itkin',
          IG.instance.system.width * 0.4,
          IG.instance.system.height / 2 + 25
        )
        this.font.draw(
          'Press Q for instructions',
          IG.instance.system.width * 0.4 - 60,
          IG.instance.system.height / 2 + 60
        )
        this.font.draw(
          'PRESS ENTER TO FIGHT',
          IG.instance.system.width * 0.4 - 30,
          IG.instance.system.height / 2 + 85
        )
        break
      case this.INSTR:
        this.bigscroll.draw(0, 0)
        this.font.draw(
          'CONTROLS!\n\n\n\n',
          IG.instance.system.width * 0.4,
          IG.instance.system.height / 4
        )
        this.font.draw(
          'Player 1: JUMP: (W) LEFT: (A) DOWN: (S) RIGHT: (D)\n\n                ATTACK: (Q) DODGE: (SHIFT)\n\n\n\n\nPlayer 2: JUMP: (I) LEFT: (J) DOWN: (K) RIGHT: (L)\n\n                ATTACK: (SPACE) DODGE: (O)\n\n\n         For best results, zoom out a little.',
          IG.instance.system.width / 5,
          IG.instance.system.height / 3
        )
        if (this.scrollTimer.delta() >= 0)
          this.font.draw('PRESS ENTER!', IG.instance.system.width * 0.4, 700)
        break
      case this.CHAR1:
        this.scroll.draw(
          (IG.instance.system.width * 1) / 4,
          IG.instance.system.height * 0.4
        )
        this.font.draw(
          'P1! Choose Your Fighter! (Q, W, E)\nX to re-pick\nPress ENTER for P2!',
          IG.instance.system.width / 2,
          IG.instance.system.height / 2,
          Font.ALIGN.CENTER
        )
        break
      case this.CHAR2:
        this.scroll.draw(
          (IG.instance.system.width * 1) / 4,
          IG.instance.system.height * 0.4
        )
        this.font.draw(
          'P2! Choose Your Fighter! (Q, W, E)\nX to re-pick\nPress ENTER to FIGHT!',
          IG.instance.system.width / 2,
          IG.instance.system.height / 2,
          Font.ALIGN.CENTER
        )
        break
      case this.STAGE:
        if (!this.levelpicked) this.background.draw(0, 0)
        // this.battlefieldImage.draw(
        //   IG.instance.system.width * 0.25,
        //   IG.instance.system.height * 0.4,
        //   null,
        //   null,
        //   250,
        //   200
        // )
        // this.sidelinesImage.draw(
        //   IG.instance.system.width * 0.55,
        //   IG.instance.system.height * 0.4,
        //   null,
        //   null,
        //   250,
        //   200
        // )
        this.scroll.draw(
          (IG.instance.system.width * 1) / 4,
          IG.instance.system.height * 0.4
        )
        this.font.draw(
          'Select Map (Q or W)\n\nThen Press ENTER!',
          (IG.instance.system.width * 1) / 2,
          IG.instance.system.height / 2,
          Font.ALIGN.CENTER
        )
        break
      case this.GAME:
        //drawing all soul bars and number of lives graphically represented on screen for both players.
        IG.instance.system.context.fillStyle = '#FFFFFF'
        IG.instance.system.context.fillRect(
          IG.instance.system.width / 8,
          IG.instance.system.height / 4,
          30,
          110
        )
        if (this.p1.soulA > 75) IG.instance.system.context.fillStyle = '#33CCFF'
        else if (this.p1.soulA <= 75 && this.p1.soulA > 50)
          IG.instance.system.context.fillStyle = '#008000'
        else if (this.p1.soulA <= 50 && this.p1.soulA > 25)
          IG.instance.system.context.fillStyle = '#FF9933'
        else if (this.p1.soulA <= 25)
          IG.instance.system.context.fillStyle = '#FF0000'
        IG.instance.system.context.fillRect(
          IG.instance.system.width / 8 + 4,
          IG.instance.system.height / 4 + 5 + (100 - this.p1.soulA),
          22,
          this.p1.soulA
        )
        for (var i = 0; i < this.p1.stocksA; i++) {
          IG.instance.system.context.fillStyle = '#008000'
          IG.instance.system.context.fillRect(
            IG.instance.system.width / 8 + 40,
            IG.instance.system.height / 4 + 30 * i,
            25,
            25
          )
        }

        IG.instance.system.context.fillStyle = '#FFFFFF'
        IG.instance.system.context.fillRect(
          (IG.instance.system.width * 7) / 8,
          IG.instance.system.height / 4,
          30,
          110
        )
        if (this.p2.soulB > 75) IG.instance.system.context.fillStyle = '#33CCFF'
        else if (this.p2.soulB <= 75 && this.p2.soulB > 50)
          IG.instance.system.context.fillStyle = '#008000'
        else if (this.p2.soulB <= 50 && this.p2.soulB > 25)
          IG.instance.system.context.fillStyle = '#FF9933'
        else if (this.p2.soulB <= 25)
          IG.instance.system.context.fillStyle = '#FF0000'
        IG.instance.system.context.fillRect(
          (IG.instance.system.width * 7) / 8 + 4,
          IG.instance.system.height / 4 + 5 + (100 - this.p2.soulB),
          22,
          this.p2.soulB
        )
        for (var i = 0; i < this.p2.stocksB; i++) {
          IG.instance.system.context.fillStyle = '#008000'
          IG.instance.system.context.fillRect(
            (IG.instance.system.width * 7) / 8 - 40,
            IG.instance.system.height / 4 + 30 * i,
            25,
            25
          )
        }

        IG.instance.system.context.fillStyle = '#FFFFFF'
        IG.instance.system.context.fillRect(
          this.p1.pos.x + 15,
          this.p1.pos.y - 10,
          8,
          8
        )
        IG.instance.system.context.fillStyle = '#000000'
        IG.instance.system.context.fillRect(
          this.p2.pos.x + 15,
          this.p2.pos.y - 10,
          8,
          8
        )
        break
      case this.GAME_OVER:
        this.scroll.draw(
          (IG.instance.system.width * 1) / 4,
          IG.instance.system.height * 0.4
        )
        this.font.draw(
          this.winner + '\nWarrior, press enter to go \nback to the menu.',
          IG.instance.system.width / 2,
          IG.instance.system.height / 2,
          Font.ALIGN.CENTER
        )
        break
    }
  }

  respawn(who) {
    if (who == 'p1') {
      this.p1.pos.x = 500
      this.p1.pos.y = 500
    }
  }
}
