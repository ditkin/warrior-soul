import IG from '../lib/impact'
import { AnimationSheet } from '../lib/animation'
import Entity from '../lib/entity'
import { Sound } from '../lib/sound'
import Timer from '../lib/timer'
import Hitbox from './Hitbox'

export default class FoxEntity extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/fox.png', 72, 72)
    this.ouch = new Sound('media/sounds/ouch.*')
    this.p1iswin = new Sound('media/sounds/p1win.*')
    this.p2iswin = new Sound('media/sounds/p2wins.*')
    this.death = new Sound('media/sounds/death.*')
    this.shine1 = new Sound('media/sounds/shine1.*')
    this.summonzebra = new Sound('media/sounds/summonzebra.*')
    this.hayaa = new Sound('media/sounds/hayaa.*')
    this.size = { x: 50, y: 60 }
    this.maxVel = { x: 900, y: 900 }
    this.walkAcc = 3000
    this.jumpVel = -500
    this.damping = 1.28
    this.jumped = false
    this.stocksA = 4
    this.stocksB = 4
    this.soulA = 100
    this.soulB = 100
    this.illurightA = false
    this.illurightB = false
    this.stunTimerA = new Timer(0.5) //=imers for stun, dodge, attack
    this.stunTimerB = new Timer(0.5)
    this.jumpTimerA = new Timer(0.5)
    this.jumpTimerB = new Timer(0.5)
    this.dodgeTimerA = new Timer(0.5)
    this.dodgeTimerB = new Timer(0.5)
    this.attTimerA = new Timer(0.5)
    this.attTimerB = new Timer(0.5)
    this.deathTimerA = new Timer(0.5)
    this.deathTimerB = new Timer(0.5)
    this.shootTimerA = new Timer(0.5)
    this.shootTimerB = new Timer(0.5)
    this.blastTimerA = new Timer(0.5)
    this.blastTimerB = new Timer(0.5)
    this.shineTimerA = new Timer(0.5)
    this.shineTimerB = new Timer(0.5)
    this.kickTimerA = new Timer(0.5)
    this.kickTimerB = new Timer(0.5)
    this.illusionTimerA = new Timer(0.5)
    this.illusionTimerB = new Timer(0.5)

    this.addAnim('idle', 0.6, [15], false)
    this.addAnim('moving', 0.12, [30, 31, 32, 33], false)
    this.addAnim('jumping', 0.2, [31, 33, 48, 49, 16, 110], true)
    this.addAnim('flying', 0.1, [65, 66, 68, 69, 87, 88], false)
    this.addAnim('shooting', 0.2, [72, 72, 72, 72, 15], false)
    this.addAnim('throwing', 0.1, [147, 148, 150, 151, 152], false)
    this.addAnim('shining', 0.1, [111, 136], false)
    this.addAnim('stunned', 0.3, [123, 131, 178, 179], false)
    this.addAnim('crouched', 0.3, [13, 140], true)
    this.addAnim('dodging', 0.1, [86, 91], false)
    this.addAnim('blasting', 0.15, [130, 134, 136], false)
    this.addAnim(
      'illusion',
      0.1,
      [100, 101, 102, 103, 104, 129, 111, 129, 111, 129],
      false
    )
    this.addAnim('kick', 0.2, [161, 164], true)

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
    super.update()

    //adjusting the players to respawn after death.
    if (this.type == Entity.TYPE.A && this.deathTimerA.delta() < 0) {
      this.pos.x = 500
      this.pos.y = 500
    } else if (this.type == Entity.TYPE.B && this.deathTimerB.delta() < 0) {
      this.pos.x = 500
      this.pos.y = 500
    }
    this.checkMovement()
    if (this.stunTimerA.delta() >= 0 && this.type == Entity.TYPE.A)
      this.checkInputs()
    else if (this.stunTimerB.delta() >= 0 && this.type == Entity.TYPE.B)
      this.checkInputs()
    this.updateAnims()
  }

  //handles death
  handleMovementTrace(res) {
    super.handleMovementTrace(res)
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
        this.pos.x = IG.instance.system.width / 2
        this.pos.y = IG.instance.system.width / 2
        if (this.stocksB == 0) {
          this.p1iswin.play()
          IG.instance.game.winner = 'Player 1 WINS!'
          this.kill()
          IG.instance.game.state = IG.instance.game.GAME_OVER
        }
      }
    }
  }

  checkMovement() {
    if (this.currentAnim == 'stunned') {
      this.accel.x = 0
      this.accel.y = 0
    }
  }

  checkInputs() {
    if (this.vel.x < 0 && !this.currentAnim.flip.x) {
      this.currentAnim.flip.x = true
    } else if (this.vel.x > 0 && this.currentAnim.flip.x) {
      this.currentAnim.flip.x = false
    }
    if (this.type == Entity.TYPE.A) {
      if (this.shineTimerA.delta() < 0) {
        if (IG.instance.input.state('p1up')) this.shineTimerA.set(0)
      }
      if (this.blastTimerA.delta() < 0 && this.blastTimerA.delta() > -1) {
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x,
          this.pos.y - this.size.y / 4,
          {
            entype: 'A',
            attack: 'weak',
            stunLength: 0.05,
            lifetime: 0.05,
            flip: false,
            damage: 0.1,
            knocX: 0.1,
            knocY: -0.1,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 25,
          }
        )
        if (
          IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right')
        )
          this.vel.x -= 5
        else if (
          !IG.instance.input.state('p1left') &&
          IG.instance.input.state('p1right')
        )
          this.vel.x += 5
      }
      if (this.blastTimerA.delta() < -0.3 && this.blastTimerA.delta() > -0.6) {
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x,
          this.pos.y + (this.size.y * 3) / 4,
          {
            entype: 'A',
            attack: 'explodeA',
            stunLength: 0.07,
            lifetime: 0.1,
            flip: false,
            damage: 0.4,
            knocX: 5,
            knocY: -5,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 25,
          }
        )
        this.vel.y -= 19
      }
      if (
        this.illusionTimerA.delta() > -0.72 &&
        this.illusionTimerA.delta() < -0.08
      ) {
        this.accel.x = 0
        if (this.illurightA) this.vel.x = 450
        else if (!this.illurightA) this.vel.x = -450
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x - this.size.x / 2,
          this.pos.y,
          {
            entype: 'A',
            attack: 'illus',
            stunLength: 0.05,
            lifetime: 0.05,
            flip: false,
            damage: 0.05,
            knocX: 0.1,
            knocY: -0.1,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 2,
          }
        )
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x + this.size.x,
          this.pos.y,
          {
            entype: 'A',
            attack: 'illus',
            stunLength: 0.05,
            lifetime: 0.05,
            flip: false,
            damage: 0.05,
            knocX: 0.1,
            knocY: -0.1,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 2,
          }
        )
      }
      if (
        this.illusionTimerA.delta() < 0 &&
        this.illusionTimerA.delta() > -0.07
      ) {
        this.vel.x = 0
        this.accel.x = 0
      }
      if (this.attTimerA.delta() < 0 && IG.instance.input.state('p1down'))
        this.vel.y += 50

      if (
        this.attTimerA.delta() >= 0 &&
        this.deathTimerA.delta() >= 0 &&
        this.illusionTimerA.delta() >= 0 &&
        this.blastTimerA.delta() >= 0 &&
        this.kickTimerA.delta() >= 0 &&
        this.shineTimerA.delta() >= 0 &&
        this.stunTimerA.delta() >= 0
      ) {
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
            this.vel.x = 130
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
        if (IG.instance.input.state('p1down') && this.standing == false) {
          this.vel.y += 175
        }
        //neutral attack, a blaster shot
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
              this.pos.x + this.size.x / 4,
              this.pos.y,
              {
                entype: 'A',
                attack: 'blastershot',
                stunLength: 0.1,
                lifetime: 1,
                flip: true,
                damage: 0.75,
                knocX: 0,
                knocY: 0,
                velx: 250,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 5,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 4,
              this.pos.y,
              {
                entype: 'A',
                attack: 'blastershot',
                stunLength: 0.1,
                lifetime: 1,
                flip: false,
                damage: 0.75,
                knocX: 0,
                knocY: 0,
                velx: -250,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 5,
              }
            )
          }
          //attack lag
          this.attTimerA.set(0.3)
          //animatin lag
          this.shootTimerA.set(0.2)
        }
        //illusion(left ground)
        if (
          IG.instance.input.state('p1att') &&
          IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (this.standing) {
            this.illurightA = false
            this.attTimerA.set(1)
            this.illusionTimerA.set(0.8)
          }
          //kick (left)
          else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'kick',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: false,
                damage: 12,
                knocX: -200,
                knocY: -100,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 10,
                accely: 0,
                priority: 35,
              }
            )
            this.attTimerA.set(1)
            this.kickTimerA.set(1)
          }
          this.accel.x = 0
        }
        //illusion(right ground)
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (this.standing) {
            this.illurightA = true
            this.attTimerA.set(1)
            this.illusionTimerA.set(0.8)
          }
          //kick(right)
          else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x,
              this.pos.y,
              {
                entype: 'A',
                attack: 'kick',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: true,
                damage: 12,
                knocX: 200,
                knocY: -100,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: -10,
                accely: 0,
                damping: this.damping,
                priority: 35,
              }
            )
            this.attTimerA.set(1)
            this.kickTimerA.set(1)
          }
          this.accel.x = 0
        }
        //blast-off attack
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          this.accel.y = 0
          this.hayaa.play()
          this.attTimerA.set(1)
          this.blastTimerA.set(1)
        }
        //shine move
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          IG.instance.input.state('p1down')
        ) {
          this.vel.y = 0
          this.accel.y = 0
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'shine',
                stunLength: 0.6,
                lifetime: 0.3,
                flip: true,
                damage: 4,
                knocX: 35,
                knocY: -10,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 45,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'shine',
                stunLength: 0.6,
                lifetime: 0.3,
                flip: false,
                damage: 4,
                knocX: 35,
                knocY: -10,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 45,
              }
            )
          }
          this.shineTimerA.set(2)
        }
      } else if (this.attTimerA.delta() < 0) {
        this.accel.x = 0
        this.accel.y = 0
      }
    } else if (this.type == Entity.TYPE.B) {
      if (this.shineTimerB.delta() < 0) {
        if (IG.instance.input.state('p2up')) this.shineTimerB.set(0)
      }
      if (this.blastTimerB.delta() < 0 && this.blastTimerB.delta() > -1) {
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x,
          this.pos.y - this.size.y / 4,
          {
            entype: 'B',
            attack: 'weak',
            stunLength: 0.05,
            lifetime: 0.05,
            flip: false,
            damage: 0.1,
            knocX: 0.1,
            knocY: -0.1,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 25,
          }
        )
        if (
          IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right')
        )
          this.vel.x -= 5
        else if (
          !IG.instance.input.state('p2left') &&
          IG.instance.input.state('p2right')
        )
          this.vel.x += 5
      }
      if (this.blastTimerB.delta() < -0.3 && this.blastTimerB.delta() > -0.6) {
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x,
          this.pos.y + (this.size.y * 3) / 4,
          {
            entype: 'B',
            attack: 'explodeA',
            stunLength: 0.07,
            lifetime: 0.1,
            flip: false,
            damage: 1.5,
            knocX: 5,
            knocY: -5,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 25,
          }
        )
        this.vel.y -= 19
      }
      if (
        this.illusionTimerB.delta() > -0.72 &&
        this.illusionTimerB.delta() < -0.08
      ) {
        this.accel.x = 0
        if (this.illurightB) this.vel.x = 450
        else if (!this.illurightB) this.vel.x = -450
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x - this.size.x / 2,
          this.pos.y,
          {
            entype: 'B',
            attack: 'illus',
            stunLength: 0.05,
            lifetime: 0.05,
            flip: false,
            damage: 0.05,
            knocX: 0.1,
            knocY: -0.1,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 2,
          }
        )
        this.hitbox = IG.instance.game.spawnEntity(
          Hitbox,
          this.pos.x + this.size.x,
          this.pos.y,
          {
            entype: 'B',
            attack: 'illus',
            stunLength: 0.05,
            lifetime: 0.05,
            flip: false,
            damage: 0.05,
            knocX: 0.1,
            knocY: -0.1,
            velx: 0,
            vely: 0,
            accelx: 0,
            accely: 0,
            priority: 2,
          }
        )
      }
      if (
        this.illusionTimerB.delta() < 0 &&
        this.illusionTimerB.delta() > -0.07
      ) {
        this.vel.x = 0
        this.accel.x = 0
      }
      if (this.attTimerB.delta() < 0 && IG.instance.input.state('p2down'))
        this.vel.y += 50

      if (
        this.attTimerB.delta() >= 0 &&
        this.deathTimerB.delta() >= 0 &&
        this.illusionTimerB.delta() >= 0 &&
        this.blastTimerB.delta() >= 0 &&
        this.kickTimerB.delta() >= 0 &&
        this.shineTimerB.delta() >= 0 &&
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
            this.vel.x = 130
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
        if (IG.instance.input.state('p2down') && this.standing == false) {
          this.vel.y += 175
        }
        //neutral attack, a blaster shot
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
              this.pos.x + this.size.x / 4,
              this.pos.y,
              {
                entype: 'B',
                attack: 'blastershot',
                stunLength: 0.1,
                lifetime: 1,
                flip: true,
                damage: 1,
                knocX: 0,
                knocY: 0,
                velx: 250,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 5,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 4,
              this.pos.y,
              {
                entype: 'B',
                attack: 'blastershot',
                stunLength: 0.1,
                lifetime: 1,
                flip: false,
                damage: 1,
                knocX: 0,
                knocY: 0,
                velx: -250,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 5,
              }
            )
          }
          //attack lag
          this.attTimerB.set(0.3)
          //animatin lag
          this.shootTimerB.set(0.2)
        }
        //illusion(left ground)
        if (
          IG.instance.input.state('p2att') &&
          IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (this.standing) {
            this.illurightB = false
            this.attTimerB.set(1)
            this.illusionTimerB.set(0.8)
          }
          //kick (left)
          else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'kick',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: false,
                damage: 12,
                knocX: -200,
                knocY: -100,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 10,
                accely: 0,
                priority: 35,
              }
            )
            this.attTimerB.set(1)
            this.kickTimerB.set(1)
          }
          this.accel.x = 0
        }
        //illusion(right ground)
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (this.standing) {
            this.illurightB = true
            this.attTimerB.set(1)
            this.illusionTimerB.set(0.8)
          }
          //kick(right)
          else if (!this.standing) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x,
              this.pos.y,
              {
                entype: 'B',
                attack: 'kick',
                stunLength: 0.8,
                lifetime: 0.7,
                flip: true,
                damage: 12,
                knocX: 200,
                knocY: -100,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: -10,
                accely: 0,
                damping: this.damping,
                priority: 35,
              }
            )
            this.attTimerB.set(1)
            this.kickTimerB.set(1)
          }
          this.accel.x = 0
        }
        //blast-off attack
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          this.accel.y = 0
          this.hayaa.play()
          this.attTimerB.set(1)
          this.blastTimerB.set(1)
        }
        //shine move
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          IG.instance.input.state('p2down')
        ) {
          this.vel.y = 0
          this.accel.y = 0
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'shine',
                stunLength: 0.6,
                lifetime: 0.3,
                flip: true,
                damage: 4,
                knocX: 35,
                knocY: -10,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 45,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'shine',
                stunLength: 0.6,
                lifetime: 0.3,
                flip: false,
                damage: 4,
                knocX: 35,
                knocY: -10,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 45,
              }
            )
          }
          this.shineTimerB.set(2)
        }
      } else if (this.attTimerB.delta() < 0) {
        this.accel.x = 0
        this.accel.y = 0
      }
    }

    if (this.vel.x < 0 && !this.currentAnim.flip.x) {
      this.currentAnim.flip.x = true
    } else if (this.vel.x > 0 && this.currentAnim.flip.x) {
      this.currentAnim.flip.x = false
    }
    //if a player is using the 'shine' move, then the only way to cancel it is to jump. but, if you jump, it is a lagless move.
    if (this.type == Entity.TYPE.A) {
      if (
        this.attTimerA.delta() >= 0 &&
        this.shootTimerA.delta() >= 0 &&
        this.stunTimerA.delta() >= 0
      ) {
        if (IG.instance.input.state('p1dodge')) {
          this.dodgeTimerA.set(1.7)
          this.attTimerA.set(1.7)
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
          if (this.standing == false) this.accel.x = -this.walkAcc / 40
        } else if (
          IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1left')
        ) {
          if (this.standing) {
            this.accel.x = this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) this.accel.x = this.walkAcc / 40
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
        //neutral attack, a bullet
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
              this.pos.x + this.size.x / 2,
              this.pos.y - this.size.y / 2,
              {
                entype: 'A',
                attack: 'bullet',
                stunLength: 0.1,
                lifetime: 1,
                flip: true,
                damage: 2,
                knocX: 7,
                knocY: -12,
                velx: 300,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 10,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y - this.size.y / 2,
              {
                entype: 'A',
                attack: 'bullet',
                stunLength: 0.1,
                lifetime: 1,
                flip: false,
                damage: 2,
                knocX: -7,
                knocY: -12,
                velx: -300,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 10,
              }
            )
          }
          //setting lag
          this.attTimerA.set(0.7)
          this.shootTimerA.set(0.5)
        }
        if (
          IG.instance.input.state('p1att') &&
          IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: true,
                damage: 8,
                knocX: 20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: false,
                damage: 8,
                knocX: -20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          }
          if (this.standing) this.vel.x = 0
          this.accel.x = 0
          this.attTimerA.set(1.3)
          this.shootTimerA.set(1.0)
        }
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: true,
                damage: 8,
                knocX: 20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'A',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: false,
                damage: 8,
                knocX: -20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          }
          if (this.standing) this.vel.x = 0
          this.accel.x = 0
          this.attTimerA.set(1.3)
          this.shootTimerA.set(1.0)
        }
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          IG.instance.input.state('p1up') &&
          !IG.instance.input.state('p1down')
        ) {
          this.accel.y = 0
          this.hitbox = IG.instance.game.spawnEntity(
            Hitbox,
            this.pos.x,
            this.pos.y - (this.size.y * 3) / 4,
            {
              entype: 'A',
              attack: 'explode',
              stunLength: 0.9,
              lifetime: 0.8,
              flip: false,
              damage: 11,
              knocX: 70,
              knocY: -500,
              velx: this.vel.x,
              vely: this.vel.y,
              accelx: 0,
              accely: 0,
              priority: 45,
            }
          )
          this.attTimerA.set(1)
          this.shootTimerA.set(0.8)
        }
        //lowshot, machine gun attack
        if (
          IG.instance.input.state('p1att') &&
          !IG.instance.input.state('p1left') &&
          !IG.instance.input.state('p1right') &&
          !IG.instance.input.state('p1up') &&
          IG.instance.input.state('p1down')
        ) {
          this.vel.y = 0
          this.accel.y = 0
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + (this.size.x * 2) / 3,
              this.pos.y,
              {
                entype: 'A',
                attack: 'lowshot',
                stunLength: 0.2,
                lifetime: 0.7,
                flip: false,
                damage: 5,
                knocX: 35,
                knocY: -10,
                velx: 20,
                vely: this.vel.y,
                accelx: 200,
                accely: 0,
                priority: 20,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - (this.size.x * 2) / 3,
              this.pos.y,
              {
                entype: 'A',
                attack: 'lowshot',
                stunLength: 0.2,
                lifetime: 0.7,
                flip: true,
                damage: 5,
                knocX: 35,
                knocY: -10,
                velx: -20,
                vely: this.vel.y,
                accelx: -200,
                accely: 0,
                priority: 20,
              }
            )
          }
          this.attTimerA.set(0.5)
        }
      } else if (this.attTimerA.delta() < 0) {
        this.accel.x = 0
        this.accel.y = 0
      }
    }

    //For entity type B controls:
    else if (this.type == Entity.TYPE.B) {
      if (
        this.attTimerB.delta() >= 0 &&
        this.shootTimerB.delta() >= 0 &&
        this.stunTimerB.delta() >= 0
      ) {
        if (IG.instance.input.state('p2dodge')) {
          this.dodgeTimerB.set(2)
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
          if (this.standing == false) this.accel.x = -this.walkAcc / 40
        } else if (
          IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2left')
        ) {
          if (this.standing) {
            this.accel.x = this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) this.accel.x = this.walkAcc / 40
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
        //neutral attack, a bullet
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
              this.pos.x + this.size.x / 2,
              this.pos.y - this.size.y / 2,
              {
                entype: 'B',
                attack: 'bullet',
                stunLength: 0.1,
                lifetime: 1,
                flip: true,
                damage: 2,
                knocX: 7,
                knocY: -12,
                velx: 300,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 10,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y - this.size.y / 2,
              {
                entype: 'B',
                attack: 'bullet',
                stunLength: 0.1,
                lifetime: 1,
                flip: false,
                damage: 2,
                knocX: -7,
                knocY: -12,
                velx: -300,
                vely: 0,
                accelx: 0,
                accely: 0,
                priority: 10,
              }
            )
          }
          //setting lag
          this.attTimerB.set(0.7)
          this.shootTimerB.set(0.5)
        }
        if (
          IG.instance.input.state('p2att') &&
          IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: true,
                damage: 8,
                knocX: 20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: false,
                damage: 8,
                knocX: -20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          }
          if (this.standing) this.vel.x = 0
          this.accel.x = 0
          this.attTimerB.set(1.3)
          this.shootTimerB.set(1)
        }
        //a strong explosion meant for juggling.
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: true,
                damage: 8,
                knocX: 20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - this.size.x / 2,
              this.pos.y,
              {
                entype: 'B',
                attack: 'explode',
                stunLength: 0.5,
                lifetime: 0.5,
                flip: false,
                damage: 8,
                knocX: -20,
                knocY: -150,
                velx: this.vel.x,
                vely: this.vel.y,
                accelx: 0,
                accely: 0,
                priority: 30,
              }
            )
          }
          if (this.standing) this.vel.x = 0
          this.accel.x = 0
          this.attTimerB.set(1.3)
          this.shootTimerB.set(1)
        }
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          IG.instance.input.state('p2up') &&
          !IG.instance.input.state('p2down')
        ) {
          this.accel.y = 0
          this.hitbox = IG.instance.game.spawnEntity(
            Hitbox,
            this.pos.x,
            this.pos.y - (this.size.y * 3) / 4,
            {
              entype: 'B',
              attack: 'explode',
              stunLength: 0.9,
              lifetime: 0.8,
              flip: false,
              damage: 11,
              knocX: 70,
              knocY: -500,
              velx: this.vel.x,
              vely: this.vel.y,
              accelx: 0,
              accely: 0,
              priority: 45,
            }
          )
          this.attTimerB.set(1)
          this.shootTimerB.set(0.8)
        }
        //lowshot, a high priority rifle-attack.
        if (
          IG.instance.input.state('p2att') &&
          !IG.instance.input.state('p2left') &&
          !IG.instance.input.state('p2right') &&
          !IG.instance.input.state('p2up') &&
          IG.instance.input.state('p2down')
        ) {
          this.vel.y = 0
          this.accel.y = 0
          if (!this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x + (this.size.x * 2) / 3,
              this.pos.y,
              {
                entype: 'B',
                attack: 'lowshot',
                stunLength: 0.2,
                lifetime: 0.7,
                flip: false,
                damage: 5,
                knocX: 35,
                knocY: -10,
                velx: 20,
                vely: this.vel.y,
                accelx: 200,
                accely: 0,
                priority: 20,
              }
            )
          } else if (this.currentAnim.flip.x) {
            this.hitbox = IG.instance.game.spawnEntity(
              Hitbox,
              this.pos.x - (this.size.x * 2) / 3,
              this.pos.y,
              {
                entype: 'B',
                attack: 'lowshot',
                stunLength: 0.2,
                lifetime: 0.7,
                flip: true,
                damage: 5,
                knocX: 35,
                knocY: -10,
                velx: -20,
                vely: this.vel.y,
                accelx: -200,
                accely: 0,
                priority: 20,
              }
            )
          }
          this.attTimerB.set(0.5)
        }
      } else if (this.attTimerB.delta() < 0) {
        this.accel.x = 0
        this.accel.y = 0
      }
    }
  }

  //updates animations in cascading orderbased on reverse importance.
  updateAnims() {
    this.facingRight = this.currentAnim.flip.x
    if (
      (this.vel.x > -1 && this.vel.x < 10) ||
      (this.vel.x < 1 && this.vel.x > -10)
    )
      this.currentAnim = this.anims.idle
    if (this.vel.x > 10 || this.vel.x < -10)
      this.currentAnim = this.anims.moving
    if (this.vel.y < -15) this.currentAnim = this.anims.jumping

    if (this.type == Entity.TYPE.A) {
      if (
        IG.instance.input.state('p1down') &&
        !IG.instance.input.state('p1up') &&
        this.standing
      )
        this.currentAnim = this.anims.crouched
      if (this.shootTimerA.delta() < 0) this.currentAnim = this.anims.shooting
      if (this.stunTimerA.delta() < 0) this.currentAnim = this.anims.stunned
      if (this.kickTimerA.delta() < 0) this.currentAnim = this.anims.kick
      if (this.illusionTimerA.delta() < 0)
        this.currentAnim = this.anims.illusion
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
      if (this.shootTimerB.delta() < 0) this.currentAnim = this.anims.shooting
      if (this.stunTimerB.delta() < 0) this.currentAnim = this.anims.stunned
      if (this.kickTimerB.delta() < 0) this.currentAnim = this.anims.kick
      if (this.illusionTimerB.delta() < 0)
        this.currentAnim = this.anims.illusion
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

  check(other) {
    //handles the logic for applying hitboxes to the chief.
    if (other instanceof Hitbox) {
      if (this.type == Entity.TYPE.A && other.type == Entity.TYPE.B) {
        if (this.dodgeTimerA.delta() > -0.4 || this.deathTimerA.delta() < 0) {
          this.vel.x = other.knocX * (80 / this.soulA)
          if (this.currentAnim == this.anims.crouched) {
            this.vel.y = other.knocY * (30 / this.soulA)
            this.stunTimerA.set((other.stunLength + 1 / this.soulA) / 2)
          } else {
            this.vel.y = other.knocY * (100 / this.soulB)
            this.stunTimerA.set(other.stunLength + 1 / this.soulB)
          }
          this.ouch.play()

          if (this.soulA > other.damage) this.soulA -= other.damage
          else if (this.soulA <= other.damage) this.soulA = 1
          other.kill()
        }
      } else if (this.type == Entity.TYPE.B && other.type == Entity.TYPE.A) {
        if (this.dodgeTimerB.delta() > -0.4 || this.deathTimerB.delta() < 0) {
          this.vel.x = other.knocX * (80 / this.soulB)
          if (this.currentAnim == this.anims.crouched) {
            this.vel.y = other.knocY * (30 / this.soulB)
            this.stunTimerB.set((other.stunLength + 1 / this.soulA) / 2)
          } else {
            this.vel.y = other.knocY * (100 / this.soulB)
            this.stunTimerB.set(other.stunLength + 1 / this.soulB)
          }
          this.ouch.play()

          if (this.soulB > other.damage) this.soulB -= other.damage
          else if (this.soulB <= other.damage) this.soulB = 1

          other.kill()
        }
      }
    }
  }
}
