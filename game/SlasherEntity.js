import IG from '../lib/impact'
import { AnimationSheet } from '../lib/animation'
import Entity from '../lib/entity'
import { Sound } from '../lib/sound'
import Timer from '../lib/timer'
import Hitbox from './Hitbox'

export default class SlasherEntity extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/slashanim1.png', 76, 66)
    this.ouch = new Sound('media/sounds/ouch.*')
    this.p1iswin = new Sound('media/sounds/p1win.*')
    this.p2iswin = new Sound('media/sounds/p2wins.*')
    this.death = new Sound('media/sounds/death.*')
    this.shine1 = new Sound('media/sounds/shine1.*')
    this.summonzebra = new Sound('media/sounds/summonzebra.*')
    this.summonlion = new Sound('media/sounds/summonlion.*')
    this.size = { x: 50, y: 66 }
    this.maxVel = { x: 900, y: 900 }
    this.walkAcc = 2500
    this.jumpVel = -450
    this.damping = 1.25
    this.jumped = false
    this.stocksA = 4
    this.stocksB = 4
    this.soulA = 100
    this.soulB = 100

    this.this.stunTimerA = new Timer(0.5) //=imers for stun, dodge, attack
    this.stunTimerB = new Timer(0.5)
    this.jumpTimerA = new Timer(0.5)
    this.jumpTimerB = new Timer(0.5)
    this.dodgeTimerA = new Timer(0.5)
    this.dodgeTimerB = new Timer(0.5)
    this.attTimerA = new Timer(0.5)
    this.attTimerB = new Timer(0.5)
    this.deathTimerA = new Timer(0.5)
    this.deathTimerB = new Timer(0.5)
    this.slashTimerA = new Timer(0.5)
    this.slashTimerB = new Timer(0.5)
    this.summonTimerA = new Timer(0.5)
    this.summonTimerB = new Timer(0.5)
    this.shineTimerA = new Timer(0.5)
    this.shineTimerB = new Timer(0.5)

    this.addAnim('idle', 1, [0], false)
    this.addAnim(
      'moving',
      0.2,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      false
    )
    this.addAnim('jumping', 0.15, [20, 22, 23, 25], true)
    this.addAnim('flying', 0.15, [19, 21, 24, 26, 28, 30], false)
    this.addAnim(
      'summoning',
      0.2,
      [51, 52, 53, 54, 55, 56, 57, 59, 60, 61, 62],
      false
    )
    this.addAnim('stunned', 0.3, [41, 42], false)
    this.addAnim('crouched', 0.2, [72], false)
    this.addAnim('dodging', 0.1, [18, 17], false)
    this.addAnim('slashing', 0.15, [44, 45, 46, 47, 48, 49], false)
    this.addAnim('shooting', 0.2, [72, 73, 74, 75, 76], false)

    this.currentAnim = this.anims.idle
    if (settings.entype == 'A') {
      this.type = Entity.TYPE.A
      this.checkAgainst = Entity.TYPE.B
    } else if (settings.entype == 'B') {
      this.type = Entity.TYPE.B
      this.checkAgainst = Entity.TYPE.A
      this.currentAnim.flip.x = true
    }
  }

  update() {
    //adjusting the players to respawn after death.
    if (this.type == Entity.TYPE.A && this.deathTimerA.delta() < 0) {
      this.pos.x = 500
      this.pos.y = 500
    } else if (this.type == Entity.TYPE.B && this.deathTimerB.delta() < 0) {
      this.pos.x = 500
      this.pos.y = 500
    }
    super.update()
    this.checkMovement()
    if (this.stunTimerA.delta() >= 0 && this.type == Entity.TYPE.A)
      this.checkInputs()
    else if (this.stunTimerB.delta() >= 0 && this.type == Entity.TYPE.B)
      this.checkInputs()
    this.updateAnims()
  }

  //handles death
  handleMovementTrace(res) {
    if (
      res.pos.x <= 50 ||
      res.pos.y <= 50 ||
      res.pos.x >= IG.instance.system.width - 90 ||
      res.pos.y > IG.instance.system.height - 90
    ) {
      if (this.type == Entity.TYPE.A && this.deathTimerA.delta() >= 0) {
        this.death.play()
        this.stocksA--
        this.deathTimerA.set(5)
        this.soulA = 100
        if (this.stocksA == 0) {
          this.p2iswin.play()
          IG.instance.game.winner = 'Player 2 WINS!'
          this.kill()
          IG.instance.game.state = IG.instance.game.GAME_OVER
        }
      } else if (this.type == Entity.TYPE.B && this.deathTimerB.delta() >= 0) {
        this.death.play()
        this.stocksB--
        this.deathTimerB.set(5)
        this.soulB = 100
        if (this.stocksB == 0) {
          this.p1iswin.play()
          IG.instance.game.winner = 'Player 1 WINS!'
          this.kill()
          IG.instance.game.state = IG.instance.game.GAME_OVER
        }
      }
    }
    super.handleMovementTrace(res)
  }
  checkMovement() {
    if (this.currentAnim == 'stunned') {
      this.accel.x = 0
      this.accel.y = 0
    }
  }

  checkInputs() {
    //i had to organize inputs based on blockers. many frames a character can't act out of, so there's a waterfall structure to it.
    if (this.vel.x < 0 && !this.currentAnim.flip.x) {
      this.currentAnim.flip.x = true
    } else if (this.vel.x > 0 && this.currentAnim.flip.x) {
      this.currentAnim.flip.x = false
    }
    if (this.type == Entity.TYPE.A) {
      //restrictions on acting.
      if (
        this.attTimerA.delta() >= 0 &&
        this.deathTimerA.delta() >= 0 &&
        this.slashTimerA.delta() >= 0 &&
        this.summonTimerA.delta() >= 0 &&
        this.stunTimerA.delta() >= 0
      ) {
        //dodge frames dont totally cover you.
        if (IG.instance.input.state('p1dodge')) {
          this.dodgeTimerA.set(1.2)
          this.attTimerA.set(1.2)
          this.vel.x = 0
          this.accel.x = 0
          this.accel.y = 0
        }
        if (
          IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right')
        ) {
          if (this.standing) {
            this.accel.x = -this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) {
            this.vel.x = -180
            this.accel.x = 0
          }
        } else if (
          IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1left')
        ) {
          if (this.standing) {
            this.accel.x = this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) {
            this.vel.x = 180
            this.accel.x = 0
          }
        } else if (
          this.standing &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right')
        ) {
          this.accel.x = 0
          this.vel.x /= this.damping
        }
        if (
          IG.instance.input.state('p1down') &&
          !IG.instance.input.state('p1up') &&
          this.standing
        ) {
          this.vel.x = this.vel.x / 2
          this.accel.x = 0
        }

        if (IG.instance.input.state('p1up') && this.standing) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = true

          this.jumpTimerA.set(0.5)
        }
        //logic for double jump, including the lock on triple jumps / higher
        else if (
          IG.instance.input.state('p1up') &&
          this.standing == false &&
          this.canJumpAgain &&
          this.jumpTimerA.delta() >= 0
        ) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = false
        }
        if (
          IG.instance.input.state('p1down') &&
          this.standing == false &&
          this.vel.y > -75
        ) {
          this.vel.y += 175
        }
        //neutral attack, a slash
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + (this.size.x * 2) / 3,
              this.pos.y + this.size.y / 4,
              {
                entype: 'A',
                attack: 'nslash',
                stunLength: 0.7,
                lifetime: 0.5,
                flip: true,
                damage: 9,
                knocX: 75,
                knocY: -75,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 40,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - (this.size.x * 2) / 3,
              this.pos.y + this.size.y / 4,
              {
                entype: 'A',
                attack: 'nslash',
                stunLength: 0.7,
                lifetime: 0.5,
                flip: false,
                damage: 9,
                knocX: -75,
                knocY: -75,
                velx: -this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 40,
              }
            )
          }
          //attack lag
          this.attTimerA.set(0.9)
          //animatin lag
          this.slashTimerA.set(0.9)
        }
        //side attack (left)
        if (
          IG.instance.input.state('p1att') &&
          IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (this.standing) {
            this.vel.x = this.vel.x / 2
            this.attTimerA.set(1.2)
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.4,
                flip: false,
                damage: 10,
                knocX: 20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 40,
                accely: 0,
                priority: 35,
              }
            )
          } else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: false,
                damage: 10,
                knocX: -20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 10,
                accely: 0,
                priority: 35,
              }
            )
            this.attTimerA.set(1.4)
          }
          this.accel.x = 0
        }
        //side attack (right)
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (this.standing) {
            this.vel.x = this.vel.x / 2
            this.attTimerA.set(1.2)
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x,
              this.pos.y,
              {
                entype: 'A',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.4,
                flip: true,
                damage: 10,
                knocX: 20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: -40,
                accely: 0,
                damping: this.damping,
                priority: 35,
              }
            )
          } else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x,
              this.pos.y,
              {
                entype: 'A',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: true,
                damage: 10,
                knocX: 20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: -10,
                accely: 0,
                damping: this.damping,
                priority: 35,
              }
            )
            this.attTimerA.set(1.4)
          }
          this.accel.x = 0
        }
        //up slash
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          this.vel.x = this.vel.x / 5
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y - this.size.y / 2,
              {
                entype: 'A',
                attack: 'uslash',
                stunLength: 1,
                lifetime: 0.7,
                flip: true,
                damage: 10,
                knocX: 35,
                knocY: -90,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: this.accel.x,
                accely: this.accel.y,
                priority: 40,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x,
              this.pos.y - this.size.y / 2,
              {
                entype: 'A',
                attack: 'uslash',
                stunLength: 1,
                lifetime: 0.7,
                flip: false,
                damage: 10,
                knocX: 35,
                knocY: -90,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: this.accel.x,
                accely: this.accel.y,
                priority: 40,
              }
            )
          }
          this.attTimerA.set(1.2)
        }
        //zebra move!
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          IG.instance.input.state('p1down')
        ) {
          if (this.standing) {
            this.vel.x = 0
            this.accel.y = 0
            var prob = Math.random()
            if (!this.currentAnim.flip.x) {
              if (prob < 0.75) {
                this.summonzebra.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x + this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'A',
                    attack: 'zebra',
                    stunLength: 1,
                    lifetime: 3,
                    flip: true,
                    damage: 12,
                    knocX: 35,
                    knocY: -10,
                    velx: 50,
                    vely: 0,
                    accelx: 100,
                    accely: 0,
                    priority: 25,
                  }
                )
              } else if (prob >= 0.75) {
                this.summonlion.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x + this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'A',
                    attack: 'lion',
                    stunLength: 1.5,
                    lifetime: 4,
                    flip: true,
                    damage: 18,
                    knocX: 150,
                    knocY: -100,
                    velx: 75,
                    vely: 0,
                    accelx: 120,
                    accely: 0,
                    priority: 35,
                  }
                )
              }
            } else if (this.currentAnim.flip.x) {
              if (prob < 0.75) {
                this.summonzebra.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x - this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'A',
                    attack: 'zebra',
                    stunLength: 1,
                    lifetime: 3,
                    flip: false,
                    damage: 12,
                    knocX: 35,
                    knocY: -10,
                    velx: -50,
                    vely: 0,
                    accelx: -100,
                    accely: 0,
                    priority: 25,
                  }
                )
              } else if (prob >= 0.75) {
                this.summonlion.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x + this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'A',
                    attack: 'lion',
                    stunLength: 1.5,
                    lifetime: 4,
                    flip: false,
                    damage: 18,
                    knocX: 150,
                    knocY: -100,
                    velx: -75,
                    vely: 0,
                    accelx: -120,
                    accely: 0,
                    priority: 35,
                  }
                )
              }
            }
            this.attTimerA.set(1.1)
            this.summonTimerA.set(1.5)
          } else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x,
              this.pos.y + this.size.y / 3,
              {
                entype: 'A',
                attack: 'dslash',
                stunLength: 1,
                lifetime: 0.7,
                flip: false,
                damage: 10,
                knocX: 35,
                knocY: -190,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: this.accel.x,
                accely: this.accel.y,
                priority: 40,
              }
            )
            this.attTimerA.set(0.8)
          }
        }
      } else if (this.attTimerA.delta() < 0) {
        this.accel.x = 0
        this.accel.y = 0
      }
    } else if (this.type == Entity.TYPE.B) {
      if (
        this.attTimerB.delta() >= 0 &&
        this.deathTimerB.delta() >= 0 &&
        this.slashTimerB.delta() >= 0 &&
        this.summonTimerB.delta() >= 0 &&
        this.stunTimerB.delta() >= 0
      ) {
        if (IG.instance.input.state('p2dodge')) {
          this.dodgeTimerB.set(1.2)
          this.attTimerB.set(1.2)
          this.vel.x = 0
          this.accel.x = 0
          this.accel.y = 0
        }
        if (
          IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right')
        ) {
          if (this.standing) {
            this.accel.x = -this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) {
            this.vel.x = -180
            this.accel.x = 0
          }
        } else if (
          IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2left')
        ) {
          if (this.standing) {
            this.accel.x = this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) {
            this.vel.x = 180
            this.accel.x = 0
          }
        } else if (
          this.standing &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right')
        ) {
          this.accel.x = 0
          this.vel.x /= this.damping
        }
        if (
          IG.instance.input.state('p2down') &&
          !IG.instance.input.state('p2up') &&
          this.standing
        ) {
          this.vel.x = this.vel.x / 2
          this.accel.x = 0
        }

        if (IG.instance.input.state('p2up') && this.standing) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = true

          this.jumpTimerB.set(0.5)
        }
        //logic for double jump, including the lock on triple jumps / higher
        else if (
          IG.instance.input.state('p2up') &&
          this.standing == false &&
          this.canJumpAgain &&
          this.jumpTimerB.delta() >= 0
        ) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = false
        }
        if (
          IG.instance.input.state('p2down') &&
          this.standing == false &&
          this.vel.y > -75
        ) {
          this.vel.y += 175
        }
        //neutral attack, a slash
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + (this.size.x * 2) / 3,
              this.pos.y + this.size.y / 4,
              {
                entype: 'B',
                attack: 'nslash',
                stunLength: 0.7,
                lifetime: 0.5,
                flip: true,
                damage: 9,
                knocX: 75,
                knocY: -75,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 40,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - (this.size.x * 2) / 3,
              this.pos.y + this.size.y / 4,
              {
                entype: 'B',
                attack: 'nslash',
                stunLength: 0.7,
                lifetime: 0.5,
                flip: false,
                damage: 9,
                knocX: -75,
                knocY: -75,
                velx: -this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 40,
              }
            )
          }
          //attack lag
          this.attTimerB.set(0.9)
          //animatin lag
          this.slashTimerB.set(0.9)
        }
        //side attack (left)
        if (
          IG.instance.input.state('p2att') &&
          IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (this.standing) {
            this.vel.x = this.vel.x / 2
            this.attTimerB.set(1.2)
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.4,
                flip: false,
                damage: 10,
                knocX: 20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 40,
                accely: 0,
                priority: 35,
              }
            )
          } else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: false,
                damage: 10,
                knocX: -20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 10,
                accely: 0,
                priority: 35,
              }
            )
            this.attTimerB.set(1.4)
          }
          this.accel.x = 0
        }
        //side attack (right)
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (this.standing) {
            this.vel.x = this.vel.x / 2
            this.attTimerB.set(1.2)
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x,
              this.pos.y,
              {
                entype: 'B',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.4,
                flip: true,
                damage: 10,
                knocX: 20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: -40,
                accely: 0,
                damping: this.damping,
                priority: 35,
              }
            )
          } else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x,
              this.pos.y,
              {
                entype: 'B',
                attack: 'hslash',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: true,
                damage: 10,
                knocX: 20,
                knocY: -200,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: -10,
                accely: 0,
                damping: this.damping,
                priority: 35,
              }
            )
            this.attTimerB.set(1.4)
          }
          this.accel.x = 0
        }
        //up slash
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          this.vel.x = this.vel.x / 5
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y - this.size.y / 2,
              {
                entype: 'B',
                attack: 'uslash',
                stunLength: 1,
                lifetime: 0.7,
                flip: true,
                damage: 10,
                knocX: 35,
                knocY: -90,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: this.accel.x,
                accely: this.accel.y,
                priority: 40,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x,
              this.pos.y - this.size.y / 2,
              {
                entype: 'B',
                attack: 'uslash',
                stunLength: 1,
                lifetime: 0.7,
                flip: false,
                damage: 10,
                knocX: 35,
                knocY: -90,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: this.accel.x,
                accely: this.accel.y,
                priority: 40,
              }
            )
          }
          this.attTimerB.set(1.2)
        }
        //summons a random animal, but it's a slash if used in midair.
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          IG.instance.input.state('p2down')
        ) {
          if (this.standing) {
            this.vel.x = 0
            this.accel.y = 0
            var prob = Math.random()

            if (!this.currentAnim.flip.x) {
              if (prob < 0.75) {
                this.summonzebra.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x + this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'B',
                    attack: 'zebra',
                    stunLength: 1,
                    lifetime: 3,
                    flip: true,
                    damage: 12,
                    knocX: 35,
                    knocY: -10,
                    velx: 50,
                    vely: 0,
                    accelx: 100,
                    accely: 0,
                    priority: 25,
                  }
                )
              } else if (prob >= 0.75) {
                this.summonlion.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x + this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'B',
                    attack: 'lion',
                    stunLength: 1.5,
                    lifetime: 4,
                    flip: true,
                    damage: 18,
                    knocX: 150,
                    knocY: -100,
                    velx: 75,
                    vely: 0,
                    accelx: 120,
                    accely: 0,
                    priority: 35,
                  }
                )
              }
            } else if (this.currentAnim.flip.x) {
              if (prob < 0.75) {
                this.summonzebra.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x - this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'B',
                    attack: 'zebra',
                    stunLength: 1,
                    lifetime: 3,
                    flip: false,
                    damage: 12,
                    knocX: 35,
                    knocY: 10,
                    velx: -50,
                    vely: 0,
                    accelx: -100,
                    accely: 0,
                    priority: 25,
                  }
                )
              } else if (prob >= 0.75) {
                this.summonlion.play()
                this.hitbox = IG.instance.game.spawnEntity(
                  Hitbox,
                  this.pos.x + this.size.x / 2,
                  this.pos.y,
                  {
                    entype: 'B',
                    attack: 'lion',
                    stunLength: 1.5,
                    lifetime: 4,
                    flip: false,
                    damage: 18,
                    knocX: 150,
                    knocY: 100,
                    velx: -75,
                    vely: 0,
                    accelx: -120,
                    accely: 0,
                    priority: 35,
                  }
                )
              }
            }
            this.attTimerB.set(1.1)
            this.summonTimerB.set(1.5)
          } else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x,
              this.pos.y + this.size.y / 3,
              {
                entype: 'B',
                attack: 'dslash',
                stunLength: 1,
                lifetime: 0.7,
                flip: false,
                damage: 10,
                knocX: 35,
                knocY: -190,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: this.accel.x,
                accely: this.accel.y,
                priority: 40,
              }
            )
            this.attTimerB.set(0.8)
          }
        }
      } else if (this.attTimerB.delta() < 0) {
        this.accel.x = 0
        this.accel.y = 0
      }
    }
  }

  updateAnims() {
    this.facingRight = this.currentAnim.flip.x
    if (
      (this.vel.x > -1 && this.vel.x < 10) ||
      (this.vel.x < 1 && this.vel.x > -10)
    )
      this.currentAnim = this.anims.idle
    if (this.vel.x > 10 || this.vel.x < -10)
      this.currentAnim = this.anims.moving
    if (this.vel.y <= -220) this.currentAnim = this.anims.jumping
    if (this.vel.y > -220 && this.vel.y != 0)
      this.currentAnim = this.anims.flying

    if (this.type == Entity.TYPE.A) {
      if (
        IG.instance.input.state('p1down') &&
        !IG.instance.input.state('p1up') &&
        this.standing
      )
        this.currentAnim = this.anims.crouched
      if (this.slashTimerA.delta() < 0) this.currentAnim = this.anims.slashing

      if (this.summonTimerA.delta() < 0) this.currentAnim = this.anims.summoning
      if (this.stunTimerA.delta() < 0) this.currentAnim = this.anims.stunned
      if (this.dodgeTimerA.delta() <= -0.4 || this.deathTimerA.delta() < 0)
        this.currentAnim = this.anims.dodging
      this.currentAnim.flip.x = this.facingRight
    } else if (this.type == Entity.TYPE.B) {
      if (
        IG.instance.input.state('p2down') &&
        !IG.instance.input.state('p2up') &&
        this.standing
      )
        this.currentAnim = this.anims.crouched
      if (this.slashTimerB.delta() < 0) this.currentAnim = this.anims.slashing

      if (this.summonTimerB.delta() < 0) this.currentAnim = this.anims.summoning
      if (this.stunTimerB.delta() < 0) this.currentAnim = this.anims.stunned
      if (this.dodgeTimerB.delta() <= -0.4 || this.deathTimerB.delta() < 0)
        this.currentAnim = this.anims.dodging
      this.currentAnim.flip.x = this.facingRight
    }
    if (
      this.vel.x < 0 &&
      this.currentAnim.flip.x &&
      this.currentAnim != this.anims.stunned
    )
      this.currentAnim.flip.x = true
    else if (
      this.vel.x > 0 &&
      !this.currentAnim.flip.x &&
      this.currentAnim != this.anims.stunned
    )
      this.currentAnim.flip.x = false
    else if (this.currentAnim == this.anims.stunned)
      this.currentAnim.flip.x = !this.currentAnim.flip.x
  }

  //handles the logic for applying hitboxes to the slasher.
  check(other) {
    if (other instanceof Hitbox) {
      if (this.type == Entity.TYPE.A && other.type == Entity.TYPE.B) {
        if (this.dodgeTimerA.delta() > -0.1 || this.deathTimerA.delta() < 0) {
          this.vel.x = other.knocX * (70 / this.soulA)
          this.accel.x = 0
          if (this.currentAnim == this.anims.crouched) {
            this.vel.y = other.knocY * (40 / this.soulA)
            this.stunTimerA.set((other.stunLength + 1 / this.soulA) / 2)
          } else {
            this.vel.y = other.knocY * (120 / this.soulB)
            this.stunTimerA.set(other.stunLength + 1 / this.soulB)
          }
          this.shine1.play()

          if (this.soulA > other.damage) this.soulA -= other.damage
          else if (this.soulA <= other.damage) this.soulA = 1
          other.kill()
        }
      } else if (this.type == Entity.TYPE.B && other.type == Entity.TYPE.A) {
        if (this.dodgeTimerB.delta() > -0.1 || this.deathTimerB.delta() < 0) {
          this.vel.x = other.knocX * (70 / this.soulB)
          this.accel.x = 0
          if (this.currentAnim == this.anims.crouched) {
            this.vel.y = other.knocY * (40 / this.soulB)
            this.stunTimerB.set((other.stunLength + 1 / this.soulA) / 2)
          } else {
            this.vel.y = other.knocY * (120 / this.soulB)
            this.stunTimerB.set(other.stunLength + 1 / this.soulB)
          }
          this.shine1.play()

          if (this.soulB > other.damage) this.soulB -= other.damage
          else if (this.soulB <= other.damage) this.soulB = 1

          other.kill()
        }
      }
    }
  }
}
