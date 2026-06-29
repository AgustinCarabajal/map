import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import {
  FLOOR_FRAMES,
  WALL_H_FRAMES,
  WALL_H_FEATURES,
  WALL_B_FRAMES,
  TEXTURE_FRAMES,
} from './tileset.js'
import { item_list } from './items.js'
import { playerStats } from './stats.js'
import { FEATURE_FLAGS } from './flags.js'
import { MOBS } from './mobs.js'

// Mapa id de item -> type (sword/shield/bow/...), para reglas según el arma.
const ITEM_TYPE = Object.fromEntries(item_list.map((it) => [it.id, it.type]))

// Mapa grande para llenar pantallas completas; la cámara sigue al player.
const COLS = 44
const ROWS = 30
const CELL = 48
const WORLD_W = COLS * CELL
const WORLD_H = ROWS * CELL
const NUM_ROOMS = 14

const FEATURE_CHANCE = 0.12
const SPEED = 150

// Personajes disponibles (frames de 100x100). Cada uno define cuántos frames
// tiene cada animación y su velocidad (los de pocos frames van más lentos).
// `body` = caja de colisión dentro del frame; `scale` = escala en pantalla.
const CHARACTERS = {
  witch: {
    idle: 'witch-idle',
    walk: 'witch-walk',
    idleFrames: 3,
    walkFrames: 3,
    idleRate: 4,
    walkRate: 8,
    frameW: 64,
    frameH: 64,
    body: { w: 15, h: 23, ox: 24, oy: 21 },
    scale: 1.4,
  },
  human: {
    idle: 'human-idle',
    walk: 'human-walk',
    idleFrames: 3,
    walkFrames: 3,
    // frameRate = frames por segundo (independiente de la cantidad de frames).
    // Más alto = animación más rápida.
    idleRate: 4,
    walkRate: 8,
    frameW: 64,
    frameH: 64,
    body: { w: 15, h: 23, ox: 24, oy: 21 },
    scale: 1.4,
  },
  warrior: {
    idle: 'warrior-idle',
    walk: 'warrior-walk',
    idleFrames: 3,
    walkFrames: 3,
    idleRate: 4, // pocas frames -> animación más lenta
    walkRate: 8,
    frameW: 64,
    frameH: 64,
    body: { w: 15, h: 23, ox: 24, oy: 21 },
    scale: 1.4,
  },
}

// Animaciones de equipo: items que se ven sobre el personaje al equiparse.
// La key debe coincidir con el `type` del item. Sprite en assets/equip/<id>.png.
// Si un item NO está acá, simplemente no muestra overlay (no rompe nada).
const EQUIP_ANIMS = {
  sword_01: { frames: 3, frameW: 64, frameH: 64, rate: 4 },
  // Frame de 100x100 sobre personaje de 64x64 -> scale ~0.9 para alinear.
  shield_10: { frames: 3, frameW: 64, frameH: 64, rate: 4 },
}

const ZOOM = 2.2 // acercamiento de la cámara
const REVEAL_CELLS = 4 // radio (en celdas) que descubre el jugador
const REVEAL_PX = REVEAL_CELLS * CELL
const FOG_COLOR = 0x05070d
const MINIMAP_W = 220 // ancho del minimapa en px

// Tamaño final del ataque (la textura es ~96px; 0.5 = la mitad).
const ATTACK_SCALE = 0.5
// Con una espada equipada el tajo aparece un poco más alejado del personaje (px).
const SWORD_ATTACK_OFFSET = 16
// Ángulo (grados) entre proyectiles cuando hay más de uno (projectileCount).
const PROJECTILE_SPREAD_DEG = 10

// --- Aura de fuego (toggle con E) ---
const AURA_RADIUS = 50 // radio del aura en px (diámetro = AURA_RADIUS * 2)
const AURA_PARTICLE_SIZE = .4 // escala de las partículas de fuego
const AURA_DENSITY = 100 // cantidad de partículas distribuidas en el borde

const MOB_HP_BAR_W = 24
const MOB_HP_BAR_H = 1
const MOB_HP_BAR_OFFSET_Y = -36

export default function Game({ weaponRef, characterRef, equipRef, onOpenStore }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    class DungeonScene extends Phaser.Scene {
      constructor() {
        super('dungeon')
      }

      preload() {
        const url = (p) => new URL(p, import.meta.url).href
        this.load.image('floors', url('../tiles.png'))
        this.load.image('wallH', url('../assets/walls/top-horizontal.png'))
        this.load.image('wallV', url('../assets/walls/top_vertical.png'))
        this.load.image('wallB', url('../assets/walls/bottom_vertical.png'))
        // Carga los spritesheets de cada personaje (idle/walk) según su tamaño
        // de frame, sin duplicar texturas (p. ej. human reusa idle como walk).
        const seen = new Set()
        for (const c of Object.values(CHARACTERS)) {
          const fw = c.frameW || 100
          const fh = c.frameH || 100
          for (const key of [c.idle, c.walk]) {
            if (seen.has(key)) continue
            seen.add(key)
            this.load.spritesheet(key, url(`../assets/soldier/${key}.png`), {
              frameWidth: fw,
              frameHeight: fh,
            })
          }
        }
        // Spritesheets de equipo (overlays sobre el personaje).
        for (const [id, cfg] of Object.entries(EQUIP_ANIMS)) {
          this.load.spritesheet(`equip-${id}`, url(`../assets/equip/${id}.png`), {
            frameWidth: cfg.frameW,
            frameHeight: cfg.frameH,
          })
        }
        // NPC mercader (mesa de crafteo).
        this.load.spritesheet('store-idle', url('../assets/npc/store-idle.png'), {
          frameWidth: 64,
          frameHeight: 64,
        })
        // Enemigos (mobs).
        for (const [id, m] of Object.entries(MOBS)) {
          this.load.spritesheet(m.texture, url(`../assets/mobs/${id}.png`), {
            frameWidth: m.frameW,
            frameHeight: m.frameH,
          })
        }
      }

      create() {
        // Registrar sub-frames de las texturas con varios tiles.
        for (const [texKey, frames] of Object.entries(TEXTURE_FRAMES)) {
          const tex = this.textures.get(texKey)
          for (const f of frames) {
            if (!tex.has(f.name)) tex.add(f.name, 0, f.x, f.y, f.w, f.h)
          }
        }

        // Pixel-art: filtrado NEAREST + animaciones idle/walk de cada personaje.
        // (algunos comparten textura idle/walk, así que evitamos recrear anims).
        for (const c of Object.values(CHARACTERS)) {
          this.textures.get(c.idle).setFilter(Phaser.Textures.FilterMode.NEAREST)
          this.textures.get(c.walk).setFilter(Phaser.Textures.FilterMode.NEAREST)
          if (!this.anims.exists(c.idle)) {
            this.anims.create({
              key: c.idle,
              frames: this.anims.generateFrameNumbers(c.idle, { start: 0, end: c.idleFrames - 1 }),
              frameRate: c.idleRate,
              repeat: -1,
            })
          }
          if (!this.anims.exists(c.walk)) {
            this.anims.create({
              key: c.walk,
              frames: this.anims.generateFrameNumbers(c.walk, { start: 0, end: c.walkFrames - 1 }),
              frameRate: c.walkRate,
              repeat: -1,
            })
          }
        }

        // Animaciones de equipo (overlays). NEAREST + loop.
        // Si la textura no cargó (p. ej. falta el PNG), se ignora sin romper.
        for (const [id, cfg] of Object.entries(EQUIP_ANIMS)) {
          const key = `equip-${id}`
          if (!this.textures.exists(key)) {
            console.warn(`[equip] falta la textura ${key} (¿existe assets/equip/${id}.png?)`)
            continue
          }
          this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
          if (!this.anims.exists(key)) {
            this.anims.create({
              key,
              frames: this.anims.generateFrameNumbers(key, { start: 0, end: cfg.frames - 1 }),
              frameRate: cfg.rate,
              repeat: -1,
            })
          }
        }

        // Capas: suelos (contenedor, fondo) y paredes (grupo estático = colisión).
        this.floorLayer = this.add.container(0, 0).setDepth(0)
        this.walls = this.physics.add.staticGroup()

        // Player (personaje inicial según selección).
        const initialChar = (characterRef && characterRef.current) || 'soldier'
        this.player = this.physics.add.sprite(0, 0, CHARACTERS[initialChar].idle, 0)
        this.player.setDepth(10)
        this.player.setCollideWorldBounds(true)
        this.applyCharacter(initialChar)

        this.physics.add.collider(this.player, this.walls)

        // Overlays de items equipados (uno por slot que tenga animación).
        // Se crean bajo demanda en updateEquip(); siempre por encima del player.
        this.equipOverlays = {} // slot -> sprite
        this.equipState = {} // slot -> itemType actual

        // NPC mercader: aparece en un borde del mapa; click abre la mesa de crafteo.
        this.textures.get('store-idle').setFilter(Phaser.Textures.FilterMode.NEAREST)
        if (!this.anims.exists('store-idle')) {
          this.anims.create({
            key: 'store-idle',
            frames: this.anims.generateFrameNumbers('store-idle', { start: 0, end: 2 }),
            frameRate: 4,
            repeat: -1,
          })
        }
        this.npc = this.add
          .sprite(0, 0, 'store-idle', 0)
          .setDepth(9)
          .setScale(1.4)
          // Área de click chica: solo el personaje (bbox ~15x23 dentro del frame).
          .setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(22, 19, 20, 28),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          })
        this.npc.play('store-idle')

        // Animaciones de mobs (idle y walk comparten la misma secuencia).
        this.mobs = this.physics.add.group()
        for (const m of Object.values(MOBS)) {
          if (!this.textures.exists(m.texture)) {
            console.warn(`[mobs] falta la textura ${m.texture}`)
            continue
          }
          this.textures.get(m.texture).setFilter(Phaser.Textures.FilterMode.NEAREST)
          for (const key of [m.idle, m.walk]) {
            if (this.anims.exists(key)) continue
            this.anims.create({
              key,
              frames: this.anims.generateFrameNumbers(m.texture, { start: 0, end: m.frames - 1 }),
              frameRate: m.animRate,
              repeat: -1,
            })
          }
        }
        this.physics.add.collider(this.mobs, this.walls)

        // --- Aura: aro de fuego animado (toggle con E) ---
        // Relleno tenue del aura (cuerpo del círculo).
        this.auraFill = this.add
          .circle(0, 0, AURA_RADIUS, 0xff6600, 0.08)
          .setDepth(8)
          .setVisible(false)

        // El aro de fuego se dibuja por frame con Graphics (mezcla aditiva).
        // Las llamas titilan en su lugar; no rotan.
        this.fireRing = this.add.graphics().setDepth(9)
        this.fireRing.setBlendMode(Phaser.BlendModes.ADD)
        this.fireRing.setVisible(false)

        // Textura de partícula (punto suave) para los estallidos de fuego.
        if (!this.textures.exists('spark')) {
          const g = this.make.graphics({ add: false })
          for (let i = 8; i > 0; i--) {
            g.fillStyle(0xffffff, (i / 8) * 0.2)
            g.fillCircle(8, 8, i)
          }
          g.generateTexture('spark', 16, 16)
          g.destroy()
        }

        // Emisor de ráfaga: dispara un estallido de fuego sobre el aro al
        // prender/apagar el aura (one-shot con explode, no emite continuo).
        this.fireBurst = this.add.particles(0, 0, 'spark', {
          lifespan: { min: 350, max: 750 },
          speed: { min: 20, max: 90 },
          accelerationY: -60, // el fuego sube al desvanecerse
          scale: { start: AURA_PARTICLE_SIZE * 1.6, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0xfff066, 0xff9933, 0xff3300, 0xaa0000],
          blendMode: 'ADD',
          emitting: false,
          emitZone: {
            type: 'edge',
            source: new Phaser.Geom.Circle(0, 0, AURA_RADIUS),
            quantity: AURA_DENSITY,
          },
        })
        this.fireBurst.setDepth(11)

        this.auraOn = false
        this.input.keyboard.on('keydown-E', () => {
          this.auraOn = !this.auraOn
          this.auraFill.setVisible(this.auraOn)
          this.fireRing.setVisible(this.auraOn)
          if (!this.auraOn) this.fireRing.clear()
          // Estallido de fuego tanto al prender como al apagar.
          this.fireBurst.explode(AURA_DENSITY, this.player.x, this.player.y)
        })

        // Cámara y límites del mundo.
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
        this.cameras.main.setZoom(ZOOM)
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

        // --- Niebla de guerra (fog) ---
        // Pincel radial suave para "borrar" la niebla alrededor del jugador.
        if (!this.textures.exists('fogBrush')) {
          const r = REVEAL_PX
          const steps = 26
          const g = this.make.graphics({ add: false })
          for (let i = steps; i >= 1; i--) {
            g.fillStyle(0xffffff, 1 - (i - 1) / steps)
            g.fillCircle(r, r, (r * i) / steps)
          }
          g.generateTexture('fogBrush', r * 2, r * 2)
          g.destroy()
        }
        // Capa de niebla cubriendo todo el mundo (se descubre al moverse).
        this.fog = this.add
          .renderTexture(0, 0, WORLD_W, WORLD_H)
          .setOrigin(0)
          .setDepth(5)
        this.discovered = null // se inicializa en generate()

        // --- Ataque (media luna) con click izquierdo ---
        // Textura del slash: una media luna afinada en PUNTA en ambos extremos.
        // Borde exterior de radio constante; el grosor va de 0 (puntas) a máximo
        // (centro), así los extremos terminan en punta.
        if (!this.textures.exists('slash')) {
          const s = 96
          const c = s / 2
          const R = 44 // radio exterior
          const T = 10 // grosor máximo (en el centro)
          const a0 = Phaser.Math.DegToRad(-54)
          const a1 = Phaser.Math.DegToRad(54)
          const steps = 28
          const g = this.make.graphics({ add: false })
          g.fillStyle(0xffffff, 1)
          g.beginPath()
          for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const ang = a0 + (a1 - a0) * t
            const x = c + Math.cos(ang) * R
            const y = c + Math.sin(ang) * R
            i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
          }
          for (let i = steps; i >= 0; i--) {
            const t = i / steps
            const ang = a0 + (a1 - a0) * t
            const r = R - T * Math.sin(Math.PI * t) // grosor 0 en las puntas
            g.lineTo(c + Math.cos(ang) * r, c + Math.sin(ang) * r)
          }
          g.closePath()
          g.fillPath()
          g.generateTexture('slash', s, s)
          g.destroy()
        }
        this.textures.get('slash').setFilter(Phaser.Textures.FilterMode.NEAREST)
        this.nextAttack = 0
        this.activeSlashes = []

        // Proyectiles: la flecha es solo una línea fina de 1px.
        if (!this.textures.exists('arrow')) {
          const g = this.make.graphics({ add: false })
          g.fillStyle(0xffffff, 1)
          g.fillRect(0, 0, 18, 1)
          g.generateTexture('arrow', 18, 1)
          g.destroy()
        }
        this.textures.get('arrow').setFilter(Phaser.Textures.FilterMode.NEAREST)
        this.projectiles = this.physics.add.group()
        this.physics.add.collider(this.projectiles, this.walls, (arrow) => arrow.destroy())

        this.input.on('pointerdown', (pointer) => {
          if (!pointer.leftButtonDown()) return
          // Si el click cae sobre el NPC (área chica = solo el personaje),
          // abre la mesa de crafteo y no ataca.
          const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
          if (
            this.npc &&
            Math.abs(wp.x - this.npc.x) <= 14 &&
            Math.abs(wp.y - this.npc.y) <= 19
          ) {
            onOpenStore?.()
            return
          }
          this.attack()
        })

        // Controles.
        this.keys = this.input.keyboard.addKeys('W,A,S,D')
        this.input.keyboard.on('keydown-R', () => this.generate())

        this.generate()
      }

      // --- Grilla: salas + pasillos en L ---
      buildGrid() {
        const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0))
        const inB = (x, y) => x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1
        const carveRoom = (rx, ry, rw, rh) => {
          for (let y = ry; y < ry + rh; y++)
            for (let x = rx; x < rx + rw; x++) if (inB(x, y)) grid[y][x] = 1
        }
        const carveH = (x1, x2, y) => {
          for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) grid[y][x] = 1
        }
        const carveV = (y1, y2, x) => {
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) grid[y][x] = 1
        }

        const rooms = []
        for (let i = 0; i < NUM_ROOMS; i++) {
          const rw = Phaser.Math.Between(4, 8)
          const rh = Phaser.Math.Between(4, 7)
          const rx = Phaser.Math.Between(2, COLS - rw - 2)
          const ry = Phaser.Math.Between(2, ROWS - rh - 2)
          carveRoom(rx, ry, rw, rh)
          rooms.push({ cx: rx + (rw >> 1), cy: ry + (rh >> 1) })
        }
        for (let i = 1; i < rooms.length; i++) {
          const a = rooms[i - 1]
          const b = rooms[i]
          if (Math.random() < 0.5) {
            carveH(a.cx, b.cx, a.cy)
            carveV(a.cy, b.cy, b.cx)
          } else {
            carveV(a.cy, b.cy, a.cx)
            carveH(a.cx, b.cx, b.cy)
          }
        }
        return { grid, rooms }
      }

      generate() {
        this.floorLayer.removeAll(true)
        this.walls.clear(true, true)
        this.projectiles?.clear(true, true)
        this.clearMobs()

        const { grid, rooms } = this.buildGrid()
        const isF = (x, y) =>
          x >= 0 && y >= 0 && x < COLS && y < ROWS && grid[y][x] === 1

        // Roles de pared por orientación.
        const role = Array.from({ length: ROWS }, () => new Array(COLS).fill(null))
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (isF(x, y)) continue
            let adj = false
            for (let dy = -1; dy <= 1 && !adj; dy++)
              for (let dx = -1; dx <= 1 && !adj; dx++)
                if (isF(x + dx, y + dy)) adj = true
            if (!adj) continue
            const fN = isF(x, y - 1)
            const fS = isF(x, y + 1)
            const fW = isF(x - 1, y)
            const fE = isF(x + 1, y)
            if (fN || fS) role[y][x] = 'H'
            else if (fW || fE) role[y][x] = 'V'
            else role[y][x] = 'H'
          }
        }
        for (let y = 0; y < ROWS; y++)
          for (let x = 0; x < COLS; x++)
            if (role[y][x] === 'V' && (y + 1 >= ROWS || role[y + 1][x] !== 'V'))
              role[y][x] = 'Vb'

        // Guardar grids para el minimapa y resetear niebla/descubierto.
        this.grid = grid
        this.role = role
        this.discovered = Array.from({ length: ROWS }, () => new Array(COLS).fill(false))
        this.fog.clear()
        this.fog.fill(FOG_COLOR, 1)

        const rnd = (arr) => Phaser.Utils.Array.GetRandom(arr)

        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const px = x * CELL
            const py = y * CELL
            if (isF(x, y)) {
              const img = this.add
                .image(px, py, 'floors', rnd(FLOOR_FRAMES).name)
                .setOrigin(0)
                .setDisplaySize(CELL, CELL)
              this.floorLayer.add(img)
              continue
            }
            const r = role[y][x]
            if (!r) continue

            let texKey, frame
            if (r === 'H') {
              const pool =
                Math.random() < FEATURE_CHANCE ? WALL_H_FEATURES : WALL_H_FRAMES
              texKey = 'wallH'
              frame = rnd(pool).name
            } else if (r === 'V') {
              texKey = 'wallV' // imagen completa = tile único
              frame = undefined
            } else {
              texKey = 'wallB'
              frame = rnd(WALL_B_FRAMES).name
            }

            // El tile de pared es además el cuerpo de colisión estático.
            const wall = this.walls.create(px + CELL / 2, py + CELL / 2, texKey, frame)
            wall.setDisplaySize(CELL, CELL).setDepth(1)
            wall.refreshBody()
          }
        }

        // Spawn del player en el centro de la primera sala (siempre suelo).
        const spawn = rooms[0]
        this.player.setVelocity(0, 0)
        this.player.setPosition(spawn.cx * CELL + CELL / 2, spawn.cy * CELL + CELL / 2)
        this.cameras.main.centerOn(this.player.x, this.player.y)

        // Posición del NPC: al lado del player (flag) o en un borde del mapa.
        let best = null
        if (FEATURE_FLAGS.npcNextToPlayer) {
          // Primer suelo adyacente al spawn del player.
          const around = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [0, 2]]
          for (const [dx, dy] of around) {
            const x = spawn.cx + dx
            const y = spawn.cy + dy
            if (isF(x, y)) { best = { x, y }; break }
          }
          if (!best) best = { x: spawn.cx, y: spawn.cy }
        } else {
          // Celda de suelo más cercana a un borde del mapa.
          let bestD = Infinity
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!isF(x, y)) continue
              const d = Math.min(x, COLS - 1 - x, y, ROWS - 1 - y)
              if (d < bestD) {
                bestD = d
                best = { x, y }
              }
            }
          }
        }
        if (best) this.npc.setPosition(best.x * CELL + CELL / 2, best.y * CELL + CELL / 2)

        this.spawnMobs(isF, spawn)
      }

      clearMobs() {
        if (!this.mobs) return
        for (const mob of this.mobs.getChildren()) {
          mob.hpBar?.bg?.destroy()
          mob.hpBar?.fill?.destroy()
        }
        this.mobs.clear(true, true)
      }

      createMobHealthBar(mob, maxHp) {
        const yOff = MOB_HP_BAR_OFFSET_Y
        const w = MOB_HP_BAR_W
        const h = MOB_HP_BAR_H
        const bg = this.add
          .rectangle(mob.x, mob.y + yOff, w, h, 0x1a1a1a)
          .setDepth(11)
          .setStrokeStyle(1, 0x000000, 0.6)
        const fill = this.add
          .rectangle(mob.x - w / 2, mob.y + yOff, w, h, 0xcc2222)
          .setOrigin(0, 0.5)
          .setDepth(12)
        mob.hpBar = { bg, fill, w, yOff, maxHp, hp: maxHp }
      }

      updateMobHealthBar(mob) {
        const bar = mob.hpBar
        if (!bar) return
        const ratio = Math.max(0, bar.hp / bar.maxHp)
        bar.bg.setPosition(mob.x, mob.y + bar.yOff)
        bar.fill.setPosition(mob.x - bar.w / 2, mob.y + bar.yOff)
        bar.fill.displayWidth = bar.w * ratio
        bar.fill.setVisible(ratio > 0)
        bar.bg.setVisible(mob.active)
      }

      spawnMob(type, x, y) {
        const cfg = MOBS[type]
        if (!cfg) return null
        const mob = this.mobs.create(x, y, cfg.texture, 0)
        mob.mobType = type
        mob.setDepth(9)
        mob.setScale(cfg.scale)
        mob.setCollideWorldBounds(true)
        mob.body.setSize(cfg.body.w, cfg.body.h)
        mob.body.setOffset(cfg.body.ox, cfg.body.oy)
        mob.play(cfg.idle)
        this.createMobHealthBar(mob, cfg.hp)
        return mob
      }

      spawnMobs(isF, spawn) {
        this.clearMobs()
        const floors = []
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (!isF(x, y)) continue
            if (Math.hypot(x - spawn.cx, y - spawn.cy) < 4) continue
            floors.push({ x, y })
          }
        }
        Phaser.Utils.Array.Shuffle(floors)
        const count = Math.min(Phaser.Math.Between(6, 10), floors.length)
        for (let i = 0; i < count; i++) {
          const { x, y } = floors[i]
          this.spawnMob('ghost', x * CELL + CELL / 2, y * CELL + CELL / 2)
        }
      }

      updateMobs() {
        if (!this.mobs) return
        for (const mob of this.mobs.getChildren()) {
          if (!mob.active) continue
          const cfg = MOBS[mob.mobType]
          if (!cfg) continue
          const dx = this.player.x - mob.x
          const dy = this.player.y - mob.y
          const dist = Math.hypot(dx, dy)
          const aggro = cfg.aggroRange ?? 200
          const chasing = dist <= aggro && dist > 4

          if (chasing) {
            mob.setVelocity((dx / dist) * cfg.speed, (dy / dist) * cfg.speed)
            if (mob.anims.currentAnim?.key !== cfg.walk) mob.play(cfg.walk, true)
            mob.setFlipX(dx < 0)
          } else {
            mob.setVelocity(0, 0)
            if (mob.anims.currentAnim?.key !== cfg.idle) mob.play(cfg.idle, true)
          }

          this.updateMobHealthBar(mob)
        }
      }

      // Cambia el personaje (sprites, escala y cuerpo de colisión).
      applyCharacter(key) {
        const c = CHARACTERS[key] || CHARACTERS.soldier
        this.activeChar = key
        this.player.setScale(c.scale)
        this.player.setTexture(c.idle, 0)
        this.player.body.setSize(c.body.w, c.body.h)
        this.player.body.setOffset(c.body.ox, c.body.oy)
        this.player.play(c.idle)
      }

      // Dispara projectileCount flechas: la principal al ángulo dado y las
      // extra en abanico simétrico (pequeño ángulo entre cada una).
      shootArrow(baseAngle) {
        const count = Math.max(1, playerStats.projectileCount || 1)
        const spread = Phaser.Math.DegToRad(PROJECTILE_SPREAD_DEG)
        const start = baseAngle - (spread * (count - 1)) / 2
        for (let i = 0; i < count; i++) this.fireArrow(start + i * spread)
      }

      // Crea una sola flecha hacia el ángulo dado.
      fireArrow(angle) {
        const arrow = this.projectiles.create(this.player.x, this.player.y, 'arrow')
        arrow.setDepth(11).setRotation(angle)
        arrow.body.setSize(14, 2, true)
        this.physics.velocityFromRotation(angle, 480, arrow.body.velocity)
        // Se autodestruye a los 2s si no chocó nada.
        this.time.delayedCall(2000, () => arrow.active && arrow.destroy())
      }

      // Ataque: media luna que barre hacia el cursor y se desvanece.
      attack() {
        const now = this.time.now
        if (now < this.nextAttack) return
        this.nextAttack = now + 280 // cooldown

        const p = this.input.activePointer
        const cursor = this.cameras.main.getWorldPoint(p.x, p.y)
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          cursor.x,
          cursor.y
        )

        const weaponType = ITEM_TYPE[weaponRef?.current]

        // Con un arco equipado en la main hand, dispara una flecha.
        if (weaponType === 'bow') {
          this.shootArrow(angle)
          return
        }

        const finalScale = ATTACK_SCALE

        // Con espada, el tajo se separa del personaje en la dirección del ataque.
        const off = weaponType === 'sword' ? SWORD_ATTACK_OFFSET : 0
        const offX = Math.cos(angle) * off
        const offY = Math.sin(angle) * off

        // Empieza diminuto (~1px) y crece hasta el tamaño final mientras barre.
        const slash = this.add
          .image(this.player.x + offX, this.player.y + offY, 'slash')
          .setDepth(11)
          .setRotation(angle - 0.5)
          .setAlpha(0.95)
          .setScale(0.02)
        slash.offX = offX
        slash.offY = offY
        this.activeSlashes.push(slash)

        const remove = () => {
          const i = this.activeSlashes.indexOf(slash)
          if (i >= 0) this.activeSlashes.splice(i, 1)
          slash.destroy()
        }

        this.tweens.add({
          targets: slash,
          scaleX: finalScale,
          scaleY: finalScale,
          rotation: angle + 0.5, // barrido
          duration: 130,
          ease: 'Quad.easeOut',
          onComplete: () => {
            // Al llegar al tamaño final, se desvanece.
            this.tweens.add({
              targets: slash,
              alpha: 0,
              scaleX: finalScale * 1.12,
              scaleY: finalScale * 1.12,
              duration: 90,
              ease: 'Quad.easeIn',
              onComplete: remove,
            })
          },
        })
      }

      // Dibuja un aro de fuego: lengüetas radiales que titilan con el tiempo.
      drawFireRing(cx, cy, t) {
        const g = this.fireRing
        g.clear()
        const N = AURA_DENSITY
        const fs = AURA_PARTICLE_SIZE

        // Aro base encendido.
        g.lineStyle(Math.max(2, 4 * fs), 0xff7a1a, 0.4)
        g.strokeCircle(cx, cy, AURA_RADIUS)

        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2
          // Parpadeo orgánico: suma de senos por ángulo, animada con el tiempo.
          const flicker =
            0.5 +
            0.35 * Math.sin(a * 6 + t * 0.012) +
            0.25 * Math.sin(a * 11 - t * 0.018)
          const len = (7 + Math.max(0, flicker) * 15) * fs
          const dx = Math.cos(a)
          const dy = Math.sin(a)
          // Lengüeta de llama: base amarilla -> punta roja, hacia afuera.
          g.fillStyle(0xffe066, 0.7)
          g.fillCircle(cx + dx * AURA_RADIUS, cy + dy * AURA_RADIUS, 6 * fs)
          g.fillStyle(0xff8a1a, 0.6)
          g.fillCircle(
            cx + dx * (AURA_RADIUS + len * 0.5),
            cy + dy * (AURA_RADIUS + len * 0.5),
            4.5 * fs
          )
          g.fillStyle(0xff3300, 0.5)
          g.fillCircle(cx + dx * (AURA_RADIUS + len), cy + dy * (AURA_RADIUS + len), 3 * fs)
        }
      }

      update(time) {
        // Cambio de personaje en caliente (desde la selección en React).
        if (characterRef && characterRef.current && characterRef.current !== this.activeChar) {
          this.applyCharacter(characterRef.current)
        }
        const char = CHARACTERS[this.activeChar]

        const { W, A, S, D } = this.keys
        let vx = 0
        let vy = 0
        if (A.isDown) vx -= 1
        if (D.isDown) vx += 1
        if (W.isDown) vy -= 1
        if (S.isDown) vy += 1

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy)
          // movementSpeed es un % de aumento sobre el SPEED base (0 = sin bono).
          const speed = SPEED * (1 + playerStats.movementSpeed / 100)
          this.player.setVelocity((vx / len) * speed, (vy / len) * speed)
          if (this.player.anims.currentAnim?.key !== char.walk) this.player.play(char.walk, true)
        } else {
          this.player.setVelocity(0, 0)
          if (this.player.anims.currentAnim?.key !== char.idle) this.player.play(char.idle, true)
        }

        // El personaje siempre mira hacia el cursor (izquierda/derecha),
        // independientemente de la dirección en que se mueva.
        const pointer = this.input.activePointer
        const cursor = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        this.player.setFlipX(cursor.x < this.player.x)

        // Los ataques activos siguen al personaje (con su offset) mientras se animan.
        for (const sl of this.activeSlashes)
          sl.setPosition(this.player.x + (sl.offX || 0), this.player.y + (sl.offY || 0))

        // El aura (relleno + aro de fuego) sigue al player.
        if (this.auraOn) {
          this.auraFill.setPosition(this.player.x, this.player.y)
          this.drawFireRing(this.player.x, this.player.y, time)
        }

        this.updateEquip()
        this.updateMobs()
        this.reveal()
      }

      // Muestra/oculta los overlays de los items equipados (en cada slot) y los
      // mantiene encima del personaje. Un item sin animación simplemente no se ve.
      updateEquip() {
        const eq = (equipRef && equipRef.current) || {}
        const charScale = CHARACTERS[this.activeChar].scale
        for (const slot of Object.keys(eq)) {
          const itemType = eq[slot] || null
          const cfg = itemType ? EQUIP_ANIMS[itemType] : null
          const key = `equip-${itemType}`
          const playable = cfg && this.anims.exists(key) // textura cargada y anim lista
          let ov = this.equipOverlays[slot]

          if (playable) {
            if (!ov) {
              ov = this.add.sprite(0, 0, key).setDepth(12)
              this.equipOverlays[slot] = ov
            }
            if (this.equipState[slot] !== itemType) {
              ov.setTexture(key).play(key).setVisible(true)
              this.equipState[slot] = itemType
            }
            ov.setPosition(this.player.x, this.player.y)
            ov.setScale(cfg.scale != null ? cfg.scale : charScale)
            ov.setFlipX(this.player.flipX)
          } else if (ov && ov.visible) {
            ov.setVisible(false).stop()
            this.equipState[slot] = null
          }
        }
      }

      // Descubre el mapa alrededor del jugador (niebla + grilla descubierta).
      reveal() {
        if (!this.discovered) return
        const px = this.player.x
        const py = this.player.y
        // Borra la niebla con el pincel radial centrado en el jugador.
        this.fog.erase('fogBrush', px - REVEAL_PX, py - REVEAL_PX)
        // Marca como descubiertas las celdas dentro del radio.
        const ccx = Math.floor(px / CELL)
        const ccy = Math.floor(py / CELL)
        for (let dy = -REVEAL_CELLS; dy <= REVEAL_CELLS; dy++) {
          for (let dx = -REVEAL_CELLS; dx <= REVEAL_CELLS; dx++) {
            const x = ccx + dx
            const y = ccy + dy
            if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue
            if (dx * dx + dy * dy <= REVEAL_CELLS * REVEAL_CELLS) this.discovered[y][x] = true
          }
        }
      }
    }

    // Escena de UI (minimapa) separada, sin el zoom de la cámara del juego.
    class UIScene extends Phaser.Scene {
      constructor() {
        super('ui')
      }
      create() {
        this.dungeon = this.scene.get('dungeon')
        this.g = this.add.graphics()
      }
      layout() {
        const pad = 14
        const scale = MINIMAP_W / WORLD_W
        const w = WORLD_W * scale
        const h = WORLD_H * scale
        return { scale, w, h, x: this.scale.width - w - pad, y: pad }
      }
      update() {
        const d = this.dungeon
        const g = this.g
        g.clear()
        if (!d || !d.discovered) return
        const { scale, x, y, w, h } = this.layout()
        const cs = Math.ceil(CELL * scale)

        g.fillStyle(0x0a0e1a, 0.75)
        g.fillRect(x, y, w, h)

        for (let cy = 0; cy < ROWS; cy++) {
          for (let cx = 0; cx < COLS; cx++) {
            if (!d.discovered[cy][cx]) continue
            if (d.role[cy][cx]) g.fillStyle(0x9aa3b2, 1) // pared
            else if (d.grid[cy][cx] === 1) g.fillStyle(0x39414f, 1) // suelo
            else continue
            g.fillRect(x + cx * CELL * scale, y + cy * CELL * scale, cs, cs)
          }
        }

        // Marcador del jugador.
        g.fillStyle(0xffd23f, 1)
        g.fillCircle(x + d.player.x * scale, y + d.player.y * scale, 3)
        // Borde.
        g.lineStyle(2, 0x9aa3b2, 0.6)
        g.strokeRect(x, y, w, h)
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || window.innerWidth,
      height: containerRef.current.clientHeight || window.innerHeight,
      backgroundColor: '#0c0f12',
      scene: [DungeonScene, UIScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scale: {
        // RESIZE: el canvas ocupa todo el contenedor (sin barras ni escalado).
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    })

    gameRef.current = game

    // El layout cambia al abrir/cerrar paneles: ajustamos el canvas al contenedor.
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width && height) game.scale.resize(width, height)
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      if (gameRef.current) {
        gameRef.current.destroy(true)
      }
    }
  }, [])

  return <div ref={containerRef} className="phaser-container" />
}
