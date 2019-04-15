import {
  Entity,
  IG,
  AnimationSheet,
  Game,
  Hitbox,
  Input,
  Sound,
  System,
  Timer,
} from 'impact'

export default class ChiefEntity extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings)

    this.animSheet = new AnimationSheet('media/chiefanim.png', 60, 64)

    this.ouch = new Sound('media/sounds/ouch.*')
    this.p1iswin = new Sound('media/sounds/p1win.*')
    this.p2iswin = new Sound('media/sounds/p2wins.*')
    this.death = new Sound('media/sounds/death.*')
    this.size = { x: 60, y: 64 }
    this.maxVel = { x: 900, y: 900 }
    this.walkAcc = 2200
    this.jumpVel = -400
    this.damping = 1.3
    this.jumped = false
    this.stocksA = 4
    this.stocksB = 4
    this.soulA = 100
    this.soulB = 100
    //timers for stun dodge attack
    this.stunTimerA = new Timer(0.5)
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

    this.addAnim('idle', 1, [0], true)
    this.addAnim('moving', 0.15, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], false)
    this.addAnim('jumping', 0.15, [12, 13, 14], true)
    this.addAnim('stunned', 0.1, [6, 7], false)
    this.addAnim('shooting', 0.3, [0, 1], false)
    this.addAnim('crouched', 0.2, [15, 16, 17], true)
    this.addAnim('dodging', 0.1, [18, 0], false)

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
    if (
      res.pos.x <= 50 ||
      res.pos.y <= 50 ||
      res.pos.x >= System.width - 90 ||
      res.pos.y > System.height - 90
    ) {
      if (this.type == Entity.TYPE.A && this.deathTimerA.delta() >= 0) {
        this.death.play()
        this.stocksA--
        this.deathTimerA.set(5)
        this.soulA = 100
        if (this.stocksA == 0) {
          this.p2iswin.play()
          Game.winner = 'Player 2 WINS!'
          this.kill()
          Game.state = Game.GAME_OVER
        }
      } else if (this.type == Entity.TYPE.B && this.deathTimerB.delta() >= 0) {
        this.death.play()
        this.stocksB--
        this.deathTimerB.set(5)
        this.soulB = 100
        this.pos.x = System.width / 2
        this.pos.y = System.width / 2
        if (this.stocksB == 0) {
          this.p1iswin.play()
          Game.winner = 'Player 1 WINS!'
          this.kill()
          Game.state = Game.GAME_OVER
        }
      }
    }
    this.parent(res)
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
    //if a player is using the 'shine' move, then the only way to cancel it is to jump. but, if you jump, it is a lagless move.
    if (this.type == Entity.TYPE.A) {
      if (
        this.attTimerA.delta() >= 0 &&
        this.shootTimerA.delta() >= 0 &&
        this.stunTimerA.delta() >= 0
      ) {
        if (Input.state('p1dodge')) {
          this.dodgeTimerA.set(1.7)
          this.attTimerA.set(1.7)
          this.vel.x = 0
          this.accel.x = 0
          this.accel.y = 0
        }
        if (Input.state('p1left') && !Input.state('p1right')) {
          if (this.standing) {
            this.accel.x = -this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) this.accel.x = -this.walkAcc / 40
        } else if (Input.state('p1right') && !Input.state('p1left')) {
          if (this.standing) {
            this.accel.x = this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) this.accel.x = this.walkAcc / 40
        } else if (
          this.standing &&
          !Input.state('p1left') &&
          !Input.state('p1right')
        ) {
          this.accel.x = 0
          this.vel.x /= this.damping
        }
        if (Input.state('p1down') && !Input.state('p1up') && this.standing) {
          this.vel.x = this.vel.x / 2
          this.accel.x = 0
        }

        if (Input.state('p1up') && this.standing) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = true

          this.jumpTimerA.set(0.5)
        }
        //logic for double jump, including the lock on triple jumps / higher
        else if (
          Input.state('p1up') &&
          this.standing == false &&
          this.canJumpAgain &&
          this.jumpTimerA.delta() >= 0
        ) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = false
        }
        if (
          Input.state('p1down') &&
          this.standing == false &&
          this.vel.y > -75
        ) {
          this.vel.y += 175
        }
        //neutral attack, a bullet
        if (
          Input.state('p1att') &&
          !Input.state('p1left') &&
          !Input.state('p1right') &&
          !Input.state('p1up') &&
          !Input.state('p1down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
          Input.state('p1att') &&
          Input.state('p1left') &&
          !Input.state('p1right') &&
          !Input.state('p1up') &&
          !Input.state('p1down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
          Input.state('p1att') &&
          !Input.state('p1left') &&
          Input.state('p1right') &&
          !Input.state('p1up') &&
          !Input.state('p1down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
          Input.state('p1att') &&
          !Input.state('p1left') &&
          !Input.state('p1right') &&
          Input.state('p1up') &&
          !Input.state('p1down')
        ) {
          this.accel.y = 0
          this.hitbox = Game.spawnEntity(
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
          Input.state('p1att') &&
          !Input.state('p1left') &&
          !Input.state('p1right') &&
          !Input.state('p1up') &&
          Input.state('p1down')
        ) {
          this.vel.y = 0
          this.accel.y = 0
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
        if (Input.state('p2dodge')) {
          this.dodgeTimerB.set(2)
          this.attTimerB.set(1.2)
          this.vel.x = 0
          this.accel.x = 0
          this.accel.y = 0
        }
        if (Input.state('p2left') && !Input.state('p2right')) {
          if (this.standing) {
            this.accel.x = -this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) this.accel.x = -this.walkAcc / 40
        } else if (Input.state('p2right') && !Input.state('p2left')) {
          if (this.standing) {
            this.accel.x = this.walkAcc
            this.vel.x /= this.damping
          }
          if (this.standing == false) this.accel.x = this.walkAcc / 40
        } else if (
          this.standing &&
          !Input.state('p2left') &&
          !Input.state('p2right')
        ) {
          this.accel.x = 0
          this.vel.x /= this.damping
        }
        if (Input.state('p2down') && !Input.state('p2up') && this.standing) {
          this.vel.x = this.vel.x / 2
          this.accel.x = 0
        }

        if (Input.state('p2up') && this.standing) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = true

          this.jumpTimerB.set(0.5)
        }
        //logic for double jump, including the lock on triple jumps / higher
        else if (
          Input.state('p2up') &&
          this.standing == false &&
          this.canJumpAgain &&
          this.jumpTimerB.delta() >= 0
        ) {
          this.vel.y = this.jumpVel
          this.canJumpAgain = false
        }
        if (
          Input.state('p2down') &&
          this.standing == false &&
          this.vel.y > -75
        ) {
          this.vel.y += 175
        }
        //neutral attack, a bullet
        if (
          Input.state('p2att') &&
          !Input.state('p2left') &&
          !Input.state('p2right') &&
          !Input.state('p2up') &&
          !Input.state('p2down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
          Input.state('p2att') &&
          Input.state('p2left') &&
          !Input.state('p2right') &&
          !Input.state('p2up') &&
          !Input.state('p2down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
          Input.state('p2att') &&
          !Input.state('p2left') &&
          Input.state('p2right') &&
          !Input.state('p2up') &&
          !Input.state('p2down')
        ) {
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
          Input.state('p2att') &&
          !Input.state('p2left') &&
          !Input.state('p2right') &&
          Input.state('p2up') &&
          !Input.state('p2down')
        ) {
          this.accel.y = 0
          this.hitbox = Game.spawnEntity(
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
          Input.state('p2att') &&
          !Input.state('p2left') &&
          !Input.state('p2right') &&
          !Input.state('p2up') &&
          Input.state('p2down')
        ) {
          this.vel.y = 0
          this.accel.y = 0
          if (!this.currentAnim.flip.x) {
            this.hitbox = Game.spawnEntity(
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
            this.hitbox = Game.spawnEntity(
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
      if (Input.state('p1down') && !Input.state('p1up') && this.standing)
        this.currentAnim = this.anims.crouched
      if (this.shootTimerA.delta() < 0) this.currentAnim = this.anims.shooting
      if (this.stunTimerA.delta() < 0) this.currentAnim = this.anims.stunned
      if (this.dodgeTimerA.delta() <= -0.4 || this.deathTimerA.delta() < 0)
        this.currentAnim = this.anims.dodging
      this.currentAnim.flip.x = this.facingRight
    } else if (this.type == Entity.TYPE.B) {
      if (Input.state('p2down') && !Input.state('p2up') && this.standing)
        this.currentAnim = this.anims.crouched
      if (this.shootTimerB.delta() < 0) this.currentAnim = this.anims.shooting
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
