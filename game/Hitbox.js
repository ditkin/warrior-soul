import IG from '../lib/impact'
import { Entity, AnimationSheet, Sound, Timer } from 'impact'

export default class Hitbox extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings)
    //the hitbox is summmoned by character attacks ad collides with players or other hitboxes to cause damage and pain.
    this.animSheet = new AnimationSheet('media/hitboxes1.png', 50, 50)
    this.size = { x: 50, y: 50 }
    this.facingRight = null
    this.stunLength = null
    this.damping = null
    this.maxVel = { x: 900, y: 900 }
    this.amzebra = false
    this.hitLength = new Timer(0.5)
    this.explod = new Sound('media/sounds/Explosion4.*')
    this.shoot = new Sound('media/sounds/Laser_Shoot5.*')
    this.swing = new Sound('media/sounds/slash.*')
    this.shine = new Sound('media/sounds/shine.*')
    this.zebra = new Sound('media/sounds/zebra.*')
    this.death = new Sound('media/sounds/death.*')
    this.lione = new Sound('media/sounds/lione.*')

    if (settings.entype == 'A') {
      this.type = Entity.TYPE.A
      this.checkAgainst = Entity.TYPE.B
    } else if (settings.entype == 'B') {
      this.type = Entity.TYPE.B
      this.checkAgainst = Entity.TYPE.A
    }
    this.addAnim('hslash', 0.1, [0, 1, 2, 3, 4, 5, 6], false)
    this.addAnim(
      'explode',
      0.05,
      [
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
      ],
      false
    )
    this.addAnim('bullet', 1, [30], false)
    this.addAnim('shine', 1, [31, 31, 8], true)
    this.addAnim('uslash', 0.1, [32, 33, 34, 35, 36, 37], false)
    this.addAnim('lion', 0.2, [38, 39, 40, 41], false)
    this.addAnim('lowshot', 0.05, [42, 43, 56, 56, 56, 56], true)
    this.addAnim('dslash', 0.1, [44, 45, 46, 47, 48, 49], false)
    this.addAnim('zebra', 0.2, [50, 51, 52, 53], false)
    this.addAnim('blastershot', 1, [54], false)

    this.hitLength.set(settings.lifetime)
    this.currentAnim.flip.x = settings.flip
    this.damage = settings.damage
    this.knocX = settings.knocX
    this.knocY = settings.knocY
    this.stunLength = settings.stunLength
    this.damping = settings.damping
    this.vel.x = settings.velx
    this.vel.y = settings.vely
    this.accel.x = settings.accelx
    this.accel.y = settings.accely
    this.priority = settings.priority

    if (settings.attack == 'bullet') {
      this.shoot.play()
      this.currentAnim = this.anims.bullet
    }
    if (settings.attack == 'explode') {
      this.explod.play()
      this.currentAnim = this.anims.explode
    }
    if (settings.attack == 'explodeA') {
      this.explod.play()
      this.currentAnim = this.anims.explode
      this.gravityFactor = 0
    }
    if (settings.attack == 'hslash') {
      this.swing.play()
      this.currentAnim = this.anims.hslash
    }
    if (settings.attack == 'uslash') {
      this.swing.play()
      this.currentAnim = this.anims.uslash
    }
    if (settings.attack == 'dslash') {
      this.swing.play()
      this.currentAnim = this.anims.dslash
    }
    if (settings.attack == 'shine') {
      this.shine.play()
      this.currentAnim = this.anims.shine
    }
    if (settings.attack == 'lowshot') {
      this.currentAnim = this.anims.lowshot
      if (this.vel.x < 0) this.currentAnim.flip.x = true
      this.shoot.play()
    }
    if (settings.attack == 'lion') {
      this.lione.play()
      this.currentAnim = this.anims.lion
      if (this.vel.x < 0) this.currentAnim.flip.x = true
    }
    if (settings.attack == 'blastershot') {
      this.shoot.play()
      this.currentAnim = this.anims.blastershot
    }
    if (settings.attack == 'illus') {
      this.swing.play()
      this.currentAnim = null
    }
    if (settings.attack == 'kick') {
      if (IG.instance.input.state('p1down') && this.type == Entity.TYPE.A)
        this.vel.y += 50
      if (IG.instance.input.state('p2down') && this.type == Entity.TYPE.B)
        this.vel.y += 50
      this.currentAnim = null
    }
    if (settings.attack == 'weak') {
      this.currentAnim = null
    }
    if (settings.attack == 'zebra') {
      this.currentAnim = this.anims.zebra
      this.zebra.play()
      this.amzebra = true
      if (this.vel.x < 0) this.currentAnim.flip.x = true
    }
    if (settings.attack == 'nslash') {
      this.currentAnim = null
    }
  }

  update() {
    super.update()
    if (this.hitLength.delta() >= 0) {
      this.kill()
    }
  }

  //priority dictates which attacks clash over others.
  check(other) {
    if (other instanceof Hitbox) {
      if (this.priority < other.priority) {
        other.priority -= this.priority
        if (this.amzebra) this.death.play()
        this.kill()
      }
      if (this.priority == other.priority) {
        this.shine.play()
        this.kill()
        other.kill()
      }
    }
  }
}
