import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {
  FLOOR_FRAMES,
  WALL_H_FRAMES,
  WALL_H_FEATURES,
  WALL_B_FRAMES,
  TEXTURE_FRAMES,
} from "./tileset.js";
import { item_list } from "./items.js";
import { rollItem } from "./modifiers.js";
import { playerStats } from "./stats.js";
import { FEATURE_FLAGS } from "./flags.js";
import { MOBS } from "./mobs.js";

// Mapa id de item -> type (sword/shield/bow/...), para reglas según el arma.
const ITEM_TYPE = Object.fromEntries(item_list.map((it) => [it.id, it.type]));

// Mapa grande para llenar pantallas completas; la cámara sigue al player.
const COLS = 44;
const ROWS = 30;
const CELL = 48;
const WORLD_W = COLS * CELL;
const WORLD_H = ROWS * CELL;
const NUM_ROOMS = 14;

const FEATURE_CHANCE = 0.12;
const SPEED = 150;

// Personajes disponibles (frames de 100x100). Cada uno define cuántos frames
// tiene cada animación y su velocidad (los de pocos frames van más lentos).
// `body` = caja de colisión dentro del frame; `scale` = escala en pantalla.
const CHARACTERS = {
  witch: {
    idle: "witch-idle",
    walk: "witch-walk",
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
    idle: "human-idle",
    walk: "human-walk",
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
    idle: "warrior-idle",
    walk: "warrior-walk",
    idleFrames: 3,
    walkFrames: 3,
    idleRate: 4, // pocas frames -> animación más lenta
    walkRate: 8,
    frameW: 64,
    frameH: 64,
    body: { w: 15, h: 23, ox: 24, oy: 21 },
    scale: 1.4,
  },
};

// Animaciones de equipo: items que se ven sobre el personaje al equiparse.
// La key debe coincidir con el `type` del item. Sprite en assets/equip/<id>.png.
// Si un item NO está acá, simplemente no muestra overlay (no rompe nada).
const EQUIP_ANIMS = {
  sword_01: { frames: 3, frameW: 64, frameH: 64, rate: 4 },
  sword_10: { frames: 3, frameW: 64, frameH: 64, rate: 4 },
  wand_00: { frames: 3, frameW: 64, frameH: 64, rate: 4 },
  // Frame de 100x100 sobre personaje de 64x64 -> scale ~0.9 para alinear.
  shield_10: { frames: 3, frameW: 64, frameH: 64, rate: 4 },
};

const ZOOM = 1.5; // acercamiento de la cámara
const REVEAL_CELLS = 4; // radio (en celdas) que descubre el jugador
const REVEAL_PX = REVEAL_CELLS * CELL;
const FOG_COLOR = 0x05070d;
const MINIMAP_W = 220; // ancho del minimapa en px

// Tipos de mapa. 'original' usa tiles.png (render clásico). 'stone' y 'gold'
// son los 2 temas del tileset assets/map_00/tileset.png. Cada tema tiene 5
// floors (~110x112) y 4 piezas de pared para autotiling por orientación (medidas
// de la imagen): interior/top (bloque con cara superior), side (vertical fina,
// muros laterales), bottom (horizontal fina, muros de abajo) y corner (bloque
// chico de esquina). Se registran como sub-frames de 'map00' en create().
const MAP_THEMES = {
  original: { label: "Original" },
  stone: {
    label: "Piedra",
    floorNames: [
      "stone-floor0",
      "stone-floor1",
      "stone-floor2",
      "stone-floor3",
      "stone-floor4",
    ],
    // Piezas de pared por orientación (ver pickWallPiece en generate()).
    walls: {
      top: "stone-wall-top",
      side: "stone-wall-side",
      bottom: "stone-wall-bottom",
      corner: "stone-wall-corner",
    },
    frames: [
      ["stone-floor0", 30, 32, 110, 112],
      ["stone-floor1", 165, 32, 110, 112],
      ["stone-floor2", 299, 32, 112, 112],
      ["stone-floor3", 435, 32, 112, 112],
      ["stone-floor4", 571, 32, 110, 112],
      ["stone-wall-top", 157, 228, 120, 121],
      ["stone-wall-side", 324, 228, 18, 112],
      ["stone-wall-bottom", 159, 394, 114, 26],
      ["stone-wall-corner", 317, 387, 33, 37],
    ],
  },
  gold: {
    label: "Oro",
    floorNames: [
      "gold-floor0",
      "gold-floor1",
      "gold-floor2",
      "gold-floor3",
      "gold-floor4",
    ],
    walls: {
      top: "gold-wall-top",
      side: "gold-wall-side",
      bottom: "gold-wall-bottom",
      corner: "gold-wall-corner",
    },
    frames: [
      ["gold-floor0", 30, 544, 110, 112],
      ["gold-floor1", 165, 544, 110, 112],
      ["gold-floor2", 299, 544, 112, 112],
      ["gold-floor3", 435, 544, 112, 112],
      ["gold-floor4", 571, 544, 110, 112],
      ["gold-wall-top", 147, 759, 122, 118],
      ["gold-wall-side", 372, 759, 17, 113],
      ["gold-wall-bottom", 146, 915, 126, 26],
      ["gold-wall-corner", 361, 910, 32, 36],
    ],
  },
};

// Tamaño final del ataque (la textura es ~96px; 0.5 = la mitad).
const ATTACK_SCALE = 0.5;
// Con una espada equipada el tajo aparece un poco más alejado del personaje (px).
const SWORD_ATTACK_OFFSET = 16;
// Ángulo (grados) entre proyectiles cuando hay más de uno (projectileCount).
const PROJECTILE_SPREAD_DEG = 10;

// --- Aura de fuego (toggle con E) ---
const AURA_RADIUS = 50; // radio del aura en px (diámetro = AURA_RADIUS * 2)
const AURA_PARTICLE_SIZE = 0.4; // escala de las partículas de fuego
const AURA_DENSITY = 100; // cantidad de partículas distribuidas en el borde

const MOB_HP_BAR_W = 24;
const MOB_HP_BAR_H = 1;
const MOB_HP_BAR_OFFSET_Y = -36;

export default function Game({
  weaponRef,
  characterRef,
  equipRef,
  reducedVisionRef,
  mapThemeRef,
  combatRef,
  worldDropRef,
  onOpenStore,
  onPickupItem,
  onAddGold,
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    class DungeonScene extends Phaser.Scene {
      constructor() {
        super("dungeon");
      }

      preload() {
        const url = (p) => new URL(p, import.meta.url).href;
        this.load.image("floors", url("../tiles.png"));
        this.load.image("wallH", url("../assets/walls/top-horizontal.png"));
        this.load.image("wallV", url("../assets/walls/top_vertical.png"));
        this.load.image("wallB", url("../assets/walls/bottom_vertical.png"));
        // Tileset del 2do tipo de mapa (temas stone / gold).
        this.load.image("map00", url("../assets/map_00/tileset.png"));
        // Carga los spritesheets de cada personaje (idle/walk) según su tamaño
        // de frame, sin duplicar texturas (p. ej. human reusa idle como walk).
        const seen = new Set();
        for (const c of Object.values(CHARACTERS)) {
          const fw = c.frameW || 100;
          const fh = c.frameH || 100;
          for (const key of [c.idle, c.walk]) {
            if (seen.has(key)) continue;
            seen.add(key);
            this.load.spritesheet(key, url(`../assets/soldier/${key}.png`), {
              frameWidth: fw,
              frameHeight: fh,
            });
          }
        }
        // Spritesheets de equipo (overlays sobre el personaje).
        for (const [id, cfg] of Object.entries(EQUIP_ANIMS)) {
          this.load.spritesheet(
            `equip-${id}`,
            url(`../assets/equip/${id}.png`),
            {
              frameWidth: cfg.frameW,
              frameHeight: cfg.frameH,
            },
          );
        }
        // NPC mercader (mesa de crafteo).
        this.load.spritesheet(
          "store-idle",
          url("../assets/npc/store-idle.png"),
          {
            frameWidth: 64,
            frameHeight: 64,
          },
        );
        // Cofre: 2 frames de 48x48 (frame 0 = cerrado, frame 1 = abierto).
        this.load.spritesheet("chest", url("../assets/chest/chest.png"), {
          frameWidth: 48,
          frameHeight: 48,
        });
        // Enemigos (mobs).
        for (const [id, m] of Object.entries(MOBS)) {
          this.load.spritesheet(m.texture, url(`../assets/mobs/${id}.png`), {
            frameWidth: m.frameW,
            frameHeight: m.frameH,
          });
        }
      }

      create() {
        // Registrar sub-frames de las texturas con varios tiles.
        for (const [texKey, frames] of Object.entries(TEXTURE_FRAMES)) {
          const tex = this.textures.get(texKey);
          for (const f of frames) {
            if (!tex.has(f.name)) tex.add(f.name, 0, f.x, f.y, f.w, f.h);
          }
        }

        // Pixel-art: filtrado NEAREST + animaciones idle/walk de cada personaje.
        // (algunos comparten textura idle/walk, así que evitamos recrear anims).
        for (const c of Object.values(CHARACTERS)) {
          this.textures
            .get(c.idle)
            .setFilter(Phaser.Textures.FilterMode.NEAREST);
          this.textures
            .get(c.walk)
            .setFilter(Phaser.Textures.FilterMode.NEAREST);
          if (!this.anims.exists(c.idle)) {
            this.anims.create({
              key: c.idle,
              frames: this.anims.generateFrameNumbers(c.idle, {
                start: 0,
                end: c.idleFrames - 1,
              }),
              frameRate: c.idleRate,
              repeat: -1,
            });
          }
          if (!this.anims.exists(c.walk)) {
            this.anims.create({
              key: c.walk,
              frames: this.anims.generateFrameNumbers(c.walk, {
                start: 0,
                end: c.walkFrames - 1,
              }),
              frameRate: c.walkRate,
              repeat: -1,
            });
          }
        }

        // Animaciones de equipo (overlays). NEAREST + loop.
        // Si la textura no cargó (p. ej. falta el PNG), se ignora sin romper.
        for (const [id, cfg] of Object.entries(EQUIP_ANIMS)) {
          const key = `equip-${id}`;
          if (!this.textures.exists(key)) {
            console.warn(
              `[equip] falta la textura ${key} (¿existe assets/equip/${id}.png?)`,
            );
            continue;
          }
          this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
          if (!this.anims.exists(key)) {
            this.anims.create({
              key,
              frames: this.anims.generateFrameNumbers(key, {
                start: 0,
                end: cfg.frames - 1,
              }),
              frameRate: cfg.rate,
              repeat: -1,
            });
          }
        }

        // Capas: suelos (contenedor, fondo) y paredes (grupo estático = colisión).
        this.floorLayer = this.add.container(0, 0).setDepth(0);
        // Capa aparte para los tiles de esquina: depth mayor que el suelo/paredes
        // (pero por debajo de la niebla) para que siempre queden superpuestos.
        this.cornerLayer = this.add.container(0, 0).setDepth(2);
        // Sombra sobre el suelo en los bordes que dan a una pared (contraste).
        this.shadowGfx = this.add.graphics().setDepth(1);
        this.walls = this.physics.add.staticGroup();

        // Player (personaje inicial según selección).
        const initialChar = (characterRef && characterRef.current) || "soldier";
        this.player = this.physics.add.sprite(
          0,
          0,
          CHARACTERS[initialChar].idle,
          0,
        );
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(true);
        // El player no es empujable: los mobs chocan contra él pero no lo
        // desplazan de su posición.
        this.player.body.pushable = false;
        this.applyCharacter(initialChar);

        this.physics.add.collider(this.player, this.walls);

        // Overlays de items equipados (uno por slot que tenga animación).
        // Se crean bajo demanda en updateEquip(); siempre por encima del player.
        this.equipOverlays = {}; // slot -> sprite
        this.equipState = {}; // slot -> itemType actual

        // NPC mercader: aparece en un borde del mapa; click abre la mesa de crafteo.
        this.textures
          .get("store-idle")
          .setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures
          .get("chest")
          .setFilter(Phaser.Textures.FilterMode.NEAREST);
        // Sub-frames del tileset map00 (floors + bloque de pared por tema).
        if (this.textures.exists("map00")) {
          const tex = this.textures.get("map00");
          tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
          for (const key of ["stone", "gold"]) {
            for (const [name, x, y, w, h] of MAP_THEMES[key].frames) {
              if (!tex.has(name)) tex.add(name, 0, x, y, w, h);
            }
          }
        }
        if (!this.anims.exists("store-idle")) {
          this.anims.create({
            key: "store-idle",
            frames: this.anims.generateFrameNumbers("store-idle", {
              start: 0,
              end: 2,
            }),
            frameRate: 4,
            repeat: -1,
          });
        }
        this.npc = this.add
          .sprite(0, 0, "store-idle", 0)
          .setDepth(9)
          .setScale(1.4)
          // Área de click chica: solo el personaje (bbox ~15x23 dentro del frame).
          .setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(22, 19, 20, 28),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          });
        this.npc.play("store-idle");

        // Animaciones de mobs (idle y walk comparten la misma secuencia).
        this.mobs = this.physics.add.group();
        for (const m of Object.values(MOBS)) {
          if (!this.textures.exists(m.texture)) {
            console.warn(`[mobs] falta la textura ${m.texture}`);
            continue;
          }
          this.textures
            .get(m.texture)
            .setFilter(Phaser.Textures.FilterMode.NEAREST);
          for (const key of [m.idle, m.walk]) {
            if (this.anims.exists(key)) continue;
            this.anims.create({
              key,
              frames: this.anims.generateFrameNumbers(m.texture, {
                start: 0,
                end: m.frames - 1,
              }),
              frameRate: m.animRate,
              repeat: -1,
            });
          }
        }
        this.physics.add.collider(this.mobs, this.walls);
        // Los mobs no se superponen entre sí ni con el player.
        this.physics.add.collider(this.mobs, this.mobs);
        this.physics.add.collider(this.player, this.mobs);

        // --- Aura: aro de fuego animado (toggle con E) ---
        // Relleno tenue del aura (cuerpo del círculo).
        this.auraFill = this.add
          .circle(0, 0, AURA_RADIUS, 0xff6600, 0.08)
          .setDepth(8)
          .setVisible(false);

        // El aro de fuego se dibuja por frame con Graphics (mezcla aditiva).
        // Las llamas titilan en su lugar; no rotan.
        this.fireRing = this.add.graphics().setDepth(9);
        this.fireRing.setBlendMode(Phaser.BlendModes.ADD);
        this.fireRing.setVisible(false);

        // Textura de partícula (punto suave) para los estallidos de fuego.
        if (!this.textures.exists("spark")) {
          const g = this.make.graphics({ add: false });
          for (let i = 8; i > 0; i--) {
            g.fillStyle(0xffffff, (i / 8) * 0.2);
            g.fillCircle(8, 8, i);
          }
          g.generateTexture("spark", 16, 16);
          g.destroy();
        }

        // Emisor de ráfaga: dispara un estallido de fuego sobre el aro al
        // prender/apagar el aura (one-shot con explode, no emite continuo).
        this.fireBurst = this.add.particles(0, 0, "spark", {
          lifespan: { min: 350, max: 750 },
          speed: { min: 20, max: 90 },
          accelerationY: -60, // el fuego sube al desvanecerse
          scale: { start: AURA_PARTICLE_SIZE * 1.6, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0xfff066, 0xff9933, 0xff3300, 0xaa0000],
          blendMode: "ADD",
          emitting: false,
          emitZone: {
            type: "edge",
            source: new Phaser.Geom.Circle(0, 0, AURA_RADIUS),
            quantity: AURA_DENSITY,
          },
        });
        this.fireBurst.setDepth(11);

        this.auraOn = false;
        this.input.keyboard.on("keydown-E", () => {
          this.auraOn = !this.auraOn;
          this.auraFill.setVisible(this.auraOn);
          this.fireRing.setVisible(this.auraOn);
          if (!this.auraOn) this.fireRing.clear();
          // Estallido de fuego tanto al prender como al apagar.
          this.fireBurst.explode(AURA_DENSITY, this.player.x, this.player.y);
        });

        // Cámara y límites del mundo.
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setZoom(ZOOM);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        // --- Niebla de guerra (fog) ---
        // Pincel radial suave para "borrar" la niebla alrededor del jugador.
        if (!this.textures.exists("fogBrush")) {
          const r = REVEAL_PX;
          const steps = 26;
          const g = this.make.graphics({ add: false });
          for (let i = steps; i >= 1; i--) {
            g.fillStyle(0xffffff, 1 - (i - 1) / steps);
            g.fillCircle(r, r, (r * i) / steps);
          }
          g.generateTexture("fogBrush", r * 2, r * 2);
          g.destroy();
        }
        // Capa de niebla cubriendo todo el mundo (se descubre al moverse).
        this.fog = this.add
          .renderTexture(0, 0, WORLD_W, WORLD_H)
          .setOrigin(0)
          .setDepth(5);
        this.discovered = null; // se inicializa en generate()

        // --- Ataque (media luna) con click izquierdo ---
        // Textura del slash: una media luna afinada en PUNTA en ambos extremos.
        // Borde exterior de radio constante; el grosor va de 0 (puntas) a máximo
        // (centro), así los extremos terminan en punta.
        if (!this.textures.exists("slash")) {
          const s = 96;
          const c = s / 2;
          const R = 44; // radio exterior
          const T = 10; // grosor máximo (en el centro)
          const a0 = Phaser.Math.DegToRad(-54);
          const a1 = Phaser.Math.DegToRad(54);
          const steps = 28;
          const g = this.make.graphics({ add: false });
          g.fillStyle(0xffffff, 1);
          g.beginPath();
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const ang = a0 + (a1 - a0) * t;
            const x = c + Math.cos(ang) * R;
            const y = c + Math.sin(ang) * R;
            i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const ang = a0 + (a1 - a0) * t;
            const r = R - T * Math.sin(Math.PI * t); // grosor 0 en las puntas
            g.lineTo(c + Math.cos(ang) * r, c + Math.sin(ang) * r);
          }
          g.closePath();
          g.fillPath();
          g.generateTexture("slash", s, s);
          g.destroy();
        }
        this.textures
          .get("slash")
          .setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.nextAttack = 0;
        this.activeSlashes = [];

        // Proyectiles: la flecha es solo una línea fina de 1px.
        if (!this.textures.exists("arrow")) {
          const g = this.make.graphics({ add: false });
          g.fillStyle(0xffffff, 1);
          g.fillRect(0, 0, 18, 1);
          g.generateTexture("arrow", 18, 1);
          g.destroy();
        }
        this.textures
          .get("arrow")
          .setFilter(Phaser.Textures.FilterMode.NEAREST);

        if (!this.textures.exists("normalBall")) {
          const g = this.make.graphics({ add: false });
          const R = 5;
          for (let r = R; r > 0; r--) {
            g.fillStyle(0xffffff, 1 - (r / R) * 0.8);
            g.fillCircle(R, R, r);
          }
          g.generateTexture("normalBall", R * 2, R * 2);
          g.destroy();
        }

        // Bola de skill: círculo radial blanco (centro brillante -> borde tenue)
        // que luego se tiñe con el color de cada skill (fuego, sombra, etc.).
        if (!this.textures.exists("ball")) {
          const g = this.make.graphics({ add: false });
          const R = 8;
          for (let r = R; r > 0; r--) {
            g.fillStyle(0xffffff, 1 - (r / R) * 0.8);
            g.fillCircle(R, R, r);
          }
          g.generateTexture("ball", R * 2, R * 2);
          g.destroy();
        }

        this.projectiles = this.physics.add.group();
        this.physics.add.collider(this.projectiles, this.walls, (arrow) =>
          arrow.destroy(),
        );
        // El proyectil daña al mob al impactar (contacto real entre cuerpos de
        // física), con el mismo daño que el ataque cuerpo a cuerpo. La flecha se
        // consume en el impacto.
        this.physics.add.overlap(this.projectiles, this.mobs, (arrow, mob) => {
          if (!arrow.active || !mob.active) return;
          if (arrow.isDestroying) return;

          // 1. Aplicar daño (esto podría destruir al mob si muere)
          this.damageMob(mob, this.attackDamage());

          const pierceCount = this.stat("pierceCount");

          // 2. Verificar que el mob SIGA vivo y tenga 'body' antes de acceder a sus propiedades
          if (
            mob.active &&
            mob.body &&
            pierceCount &&
            pierceCount > 0 &&
            !arrow.hasPierced
          ) {
            arrow.hasPierced = true;

            // Calcular el radio de forma segura (con un valor por defecto si falla algo)
            const mobRadius =
              Math.max(mob.body.width || 0, mob.body.height || 0) / 2;
            const spawnMargin = 12;
            const spawnDistance = mobRadius + spawnMargin;

            for (let i = 0; i < pierceCount; i++) {
              const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

              const spawnX = mob.x + Math.cos(randomAngle) * spawnDistance;
              const spawnY = mob.y + Math.sin(randomAngle) * spawnDistance;

              this.fireArrow(
                randomAngle,
                this.stat("attackSpeed"),
                combatRef?.current?.projectile,
                spawnX,
                spawnY,
                true,
              );
            }
          }

          // 3. Destruir la flecha original
          arrow.isDestroying = true;
          arrow.destroy();
        });

        this.input.on("pointerdown", (pointer) => {
          if (!pointer.leftButtonDown()) return;
          // Si el click cae sobre el NPC (área chica = solo el personaje),
          // abre la mesa de crafteo y no ataca.
          const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          if (
            this.npc &&
            Math.abs(wp.x - this.npc.x) <= 14 &&
            Math.abs(wp.y - this.npc.y) <= 19
          ) {
            onOpenStore?.();
            return;
          }
          // Click sobre un cofre cerrado cercano -> abrirlo (y no atacar).
          const chest = this.getChestAtPoint(wp);
          if (chest) {
            this.openChest(chest);
            return;
          }
          // Click sobre un item del suelo cercano -> recogerlo (y no atacar).
          const loot = this.getLootAtPoint(wp);
          if (loot) {
            this.pickupLoot(loot);
            return;
          }
          this.attack();
        });

        // Controles.
        this.keys = this.input.keyboard.addKeys("W,A,S,D");
        this.input.keyboard.on("keydown-R", () => this.generate());

        // Puente para que App pueda tirar items al suelo desde el inventario.
        if (worldDropRef)
          worldDropRef.current = (item) => this.dropWorldItem(item);

        this.generate();
      }

      // --- Grilla: salas + pasillos en L ---
      buildGrid() {
        const grid = Array.from({ length: ROWS }, () =>
          new Array(COLS).fill(0),
        );
        const inB = (x, y) => x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1;
        const carveRoom = (rx, ry, rw, rh) => {
          for (let y = ry; y < ry + rh; y++)
            for (let x = rx; x < rx + rw; x++) if (inB(x, y)) grid[y][x] = 1;
        };
        const carveH = (x1, x2, y) => {
          for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
            grid[y][x] = 1;
        };
        const carveV = (y1, y2, x) => {
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
            grid[y][x] = 1;
        };

        const rooms = [];
        for (let i = 0; i < NUM_ROOMS; i++) {
          const rw = Phaser.Math.Between(4, 8);
          const rh = Phaser.Math.Between(4, 7);
          const rx = Phaser.Math.Between(2, COLS - rw - 2);
          const ry = Phaser.Math.Between(2, ROWS - rh - 2);
          carveRoom(rx, ry, rw, rh);
          rooms.push({ cx: rx + (rw >> 1), cy: ry + (rh >> 1) });
        }
        for (let i = 1; i < rooms.length; i++) {
          const a = rooms[i - 1];
          const b = rooms[i];
          if (Math.random() < 0.5) {
            carveH(a.cx, b.cx, a.cy);
            carveV(a.cy, b.cy, b.cx);
          } else {
            carveV(a.cy, b.cy, a.cx);
            carveH(a.cx, b.cx, b.cy);
          }
        }

        // Limpieza: abrir separadores finos. Si una celda de pared tiene suelo a
        // <=2 celdas en dos direcciones opuestas (sólo pared entre medio), la
        // convertimos en suelo. Así desaparecen las paredes "sandwich" (suelo de
        // los dos lados) y los separadores finos entre salas: los espacios se
        // fusionan y quedan más grandes, y toda pared termina con suelo de un
        // lado y negro (exterior) del otro. Sólo agrega suelo -> no rompe la
        // conectividad ni el spawn.
        const floorWithin = (x, y, dx, dy) => {
          for (let s = 1; s <= 2; s++) {
            const nx = x + dx * s;
            const ny = y + dy * s;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
            if (grid[ny][nx] === 1) return true;
          }
          return false;
        };
        let changed = true;
        while (changed) {
          changed = false;
          for (let y = 1; y < ROWS - 1; y++)
            for (let x = 1; x < COLS - 1; x++) {
              if (grid[y][x] === 1) continue;
              const opH = floorWithin(x, y, -1, 0) && floorWithin(x, y, 1, 0);
              const opV = floorWithin(x, y, 0, -1) && floorWithin(x, y, 0, 1);
              if (opH || opV) {
                grid[y][x] = 1;
                changed = true;
              }
            }
        }
        return { grid, rooms };
      }

      generate() {
        this.floorLayer.removeAll(true);
        this.cornerLayer.removeAll(true);
        this.shadowGfx.clear();
        this.walls.clear(true, true);
        this.projectiles?.clear(true, true);
        for (const sl of this.activeSlashes || []) sl.destroy();
        this.activeSlashes = [];
        this.clearMobs();

        const { grid, rooms } = this.buildGrid();
        const isF = (x, y) =>
          x >= 0 && y >= 0 && x < COLS && y < ROWS && grid[y][x] === 1;

        // Roles de pared por orientación.
        const role = Array.from({ length: ROWS }, () =>
          new Array(COLS).fill(null),
        );
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (isF(x, y)) continue;
            let adj = false;
            for (let dy = -1; dy <= 1 && !adj; dy++)
              for (let dx = -1; dx <= 1 && !adj; dx++)
                if (isF(x + dx, y + dy)) adj = true;
            if (!adj) continue;
            const fN = isF(x, y - 1);
            const fS = isF(x, y + 1);
            const fW = isF(x - 1, y);
            const fE = isF(x + 1, y);
            if (fN || fS) role[y][x] = "H";
            else if (fW || fE) role[y][x] = "V";
            else role[y][x] = "H";
          }
        }
        for (let y = 0; y < ROWS; y++)
          for (let x = 0; x < COLS; x++)
            if (role[y][x] === "V" && (y + 1 >= ROWS || role[y + 1][x] !== "V"))
              role[y][x] = "Vb";

        // Guardar grids para el minimapa y resetear niebla/descubierto.
        this.grid = grid;
        this.role = role;
        this.discovered = Array.from({ length: ROWS }, () =>
          new Array(COLS).fill(false),
        );
        this.fog.clear();
        this.fog.fill(FOG_COLOR, 1);

        const rnd = (arr) => Phaser.Utils.Array.GetRandom(arr);

        // Tema del mapa: 'original' (tiles.png) o 'stone'/'gold' (map00).
        this.theme = (mapThemeRef && mapThemeRef.current) || "original";
        const theme = MAP_THEMES[this.theme] || MAP_THEMES.original;
        const themed = !!theme.floorNames && this.textures.exists("map00");

        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const px = x * CELL;
            const py = y * CELL;
            if (isF(x, y)) {
              const img = themed
                ? this.add.image(px, py, "map00", rnd(theme.floorNames))
                : this.add.image(px, py, "floors", rnd(FLOOR_FRAMES).name);
              img.setOrigin(0).setDisplaySize(CELL, CELL);
              this.floorLayer.add(img);
              // Sombra en el borde del suelo que da a una pared (degradado suave
              // apilando franjas de alpha decreciente hacia el interior).
              const g = this.shadowGfx;
              const bands = [
                [0, 5, 0.32],
                [5, 10, 0.18],
                [10, 15, 0.08],
              ];
              for (const [a, b, al] of bands) {
                const t = b - a;
                g.fillStyle(0x000000, al);
                if (!isF(x, y - 1)) g.fillRect(px, py + a, CELL, t); // pared arriba
                if (!isF(x, y + 1)) g.fillRect(px, py + CELL - b, CELL, t); // abajo
                if (!isF(x - 1, y)) g.fillRect(px + a, py, t, CELL); // izquierda
                if (!isF(x + 1, y)) g.fillRect(px + CELL - b, py, t, CELL); // derecha
              }
              continue;
            }
            const r = role[y][x];
            if (!r) continue;

            // El tile de pared es además el cuerpo de colisión estático.
            let wall;
            if (themed) {
              // Autotiling por orientación. Solo usamos 2 piezas de pared:
              // 'bottom' (horizontal fina) para muros arriba/abajo y 'side'
              // (vertical fina) para muros laterales; nunca el bloque interior.
              // El tile de esquina se dibuja aparte, siempre superpuesto encima.
              const fN = isF(x, y - 1);
              const fS = isF(x, y + 1);
              const fW = isF(x - 1, y);
              const fE = isF(x + 1, y);
              const isCorner = (fN || fS) && (fW || fE);

              // Colisión: bloque invisible que llena la celda (gameplay igual).
              wall = this.walls.create(
                px + CELL / 2,
                py + CELL / 2,
                "map00",
                theme.walls.side,
              );
              wall.setVisible(false);

              // Cada pieza a escala real (misma relación que el suelo, ~111px ->
              // CELL), anclada al borde que da al suelo -> conservan su proporción.
              const S = CELL / 111;
              const addPiece = (name, oX, oY, vX, vY, layer) => {
                const fr = this.textures.getFrame("map00", name);
                const im = this.add
                  .image(vX, vY, "map00", name)
                  .setOrigin(oX, oY)
                  .setDisplaySize(fr.width * S, fr.height * S);
                (layer || this.floorLayer).add(im);
                return im;
              };

              if (isCorner) {
                // Vértice que da al suelo (E->derecha/W->izq, S->abajo/N->arriba).
                const cOx = fE ? 1 : 0;
                const cOy = fS ? 1 : 0;
                const cVx = fE ? px + CELL : px;
                const cVy = fS ? py + CELL : py;
                // Muro horizontal (bottom) y lateral (side) que se juntan aquí.
                addPiece(theme.walls.bottom, 0.5, cOy, px + CELL / 2, cVy);
                addPiece(theme.walls.side, cOx, 0.5, cVx, py + CELL / 2);
                // Tile de esquina siempre encima (capa aparte, mayor depth).
                addPiece(
                  theme.walls.corner,
                  cOx,
                  cOy,
                  cVx,
                  cVy,
                  this.cornerLayer,
                );
              } else if (fN || fS) {
                // Muro horizontal: pieza 'bottom' pegada al borde con suelo.
                addPiece(
                  theme.walls.bottom,
                  0.5,
                  fS ? 1 : 0,
                  px + CELL / 2,
                  fS ? py + CELL : py,
                );
              } else if (fW || fE) {
                // Muro lateral: pieza 'side' pegada al borde con suelo.
                addPiece(
                  theme.walls.side,
                  fE ? 1 : 0,
                  0.5,
                  fE ? px + CELL : px,
                  py + CELL / 2,
                );
              } else {
                // Esquina convexa (solo suelo en diagonal): tile de esquina en el
                // vértice que apunta al suelo, siempre superpuesto encima.
                const dSE = isF(x + 1, y + 1);
                const dSW = isF(x - 1, y + 1);
                const dNE = isF(x + 1, y - 1);
                const east = dSE || dNE;
                const south = dSE || dSW;
                addPiece(
                  theme.walls.corner,
                  east ? 1 : 0,
                  south ? 1 : 0,
                  east ? px + CELL : px,
                  south ? py + CELL : py,
                  this.cornerLayer,
                );
              }
            } else {
              let texKey, frame;
              if (r === "H") {
                const pool =
                  Math.random() < FEATURE_CHANCE
                    ? WALL_H_FEATURES
                    : WALL_H_FRAMES;
                texKey = "wallH";
                frame = rnd(pool).name;
              } else if (r === "V") {
                texKey = "wallV"; // imagen completa = tile único
                frame = undefined;
              } else {
                texKey = "wallB";
                frame = rnd(WALL_B_FRAMES).name;
              }
              wall = this.walls.create(
                px + CELL / 2,
                py + CELL / 2,
                texKey,
                frame,
              );
            }
            wall.setDisplaySize(CELL, CELL).setDepth(1);
            wall.refreshBody();
          }
        }

        // Spawn del player en el centro de la primera sala (siempre suelo).
        const spawn = rooms[0];
        this.player.setVelocity(0, 0);
        this.player.setPosition(
          spawn.cx * CELL + CELL / 2,
          spawn.cy * CELL + CELL / 2,
        );
        this.cameras.main.centerOn(this.player.x, this.player.y);

        // Posición del NPC: al lado del player (flag) o en un borde del mapa.
        let best = null;
        if (FEATURE_FLAGS.npcNextToPlayer) {
          // Primer suelo adyacente al spawn del player.
          const around = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [2, 0],
            [0, 2],
          ];
          for (const [dx, dy] of around) {
            const x = spawn.cx + dx;
            const y = spawn.cy + dy;
            if (isF(x, y)) {
              best = { x, y };
              break;
            }
          }
          if (!best) best = { x: spawn.cx, y: spawn.cy };
        } else {
          // Celda de suelo más cercana a un borde del mapa.
          let bestD = Infinity;
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!isF(x, y)) continue;
              const d = Math.min(x, COLS - 1 - x, y, ROWS - 1 - y);
              if (d < bestD) {
                bestD = d;
                best = { x, y };
              }
            }
          }
        }
        if (best)
          this.npc.setPosition(
            best.x * CELL + CELL / 2,
            best.y * CELL + CELL / 2,
          );

        this.spawnMobs(isF, spawn);
        this.spawnChests(isF, spawn);
      }

      clearMobs() {
        if (!this.mobs) return;
        for (const mob of this.mobs.getChildren()) {
          mob.hpBar?.bg?.destroy();
          mob.hpBar?.fill?.destroy();
        }
        this.mobs.clear(true, true);
      }

      createMobHealthBar(mob, maxHp) {
        const yOff = MOB_HP_BAR_OFFSET_Y;
        const w = MOB_HP_BAR_W;
        const h = MOB_HP_BAR_H;
        const bg = this.add
          .rectangle(mob.x, mob.y + yOff, w, h, 0x1a1a1a)
          .setDepth(11)
          .setStrokeStyle(1, 0x000000, 0.6);
        const fill = this.add
          .rectangle(mob.x - w / 2, mob.y + yOff, w, h, 0xcc2222)
          .setOrigin(0, 0.5)
          .setDepth(12);
        mob.hpBar = { bg, fill, w, yOff, maxHp, hp: maxHp };
      }

      updateMobHealthBar(mob) {
        const bar = mob.hpBar;
        if (!bar) return;
        const ratio = Math.max(0, bar.hp / bar.maxHp);
        bar.bg.setPosition(mob.x, mob.y + bar.yOff);
        bar.fill.setPosition(mob.x - bar.w / 2, mob.y + bar.yOff);
        bar.fill.displayWidth = bar.w * ratio;
        bar.fill.setVisible(ratio > 0);
        bar.bg.setVisible(mob.active);
      }

      spawnMob(type, x, y) {
        const cfg = MOBS[type];
        if (!cfg) return null;
        const mob = this.mobs.create(x, y, cfg.texture, 0);
        mob.mobType = type;
        // Stats de combate del mob (los lee damageMob para aplicar defensa y
        // resistencias por elemento). Sin esto quedan undefined y el daño
        // ignoraría los valores definidos en mobs.js.
        mob.defense = cfg.defense || 0;
        mob.resistences = cfg.resistences || {};
        mob.setDepth(9);
        mob.setScale(cfg.scale);
        mob.setCollideWorldBounds(true);
        mob.body.setSize(cfg.body.w, cfg.body.h);
        mob.body.setOffset(cfg.body.ox, cfg.body.oy);
        mob.play(cfg.idle);
        this.createMobHealthBar(mob, cfg.hp);
        return mob;
      }

      spawnMobs(isF, spawn) {
        this.clearMobs();
        const floors = [];
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (!isF(x, y)) continue;
            if (Math.hypot(x - spawn.cx, y - spawn.cy) < 4) continue;
            floors.push({ x, y });
          }
        }
        Phaser.Utils.Array.Shuffle(floors);
        const count = Math.min(Phaser.Math.Between(6, 10), floors.length);
        for (let i = 0; i < count; i++) {
          const { x, y } = floors[i];
          this.spawnMob("ghost", x * CELL + CELL / 2, y * CELL + CELL / 2);
        }
      }

      // --- Cofres ---
      // Coloca cofres cerrados en celdas de suelo al azar (lejos del spawn).
      spawnChests(isF, spawn) {
        for (const c of this.chests || []) c.destroy();
        this.chests = [];
        for (const b of this.chestLoot || []) b.destroy();
        this.chestLoot = [];

        const floors = [];
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (!isF(x, y)) continue;
            if (Math.hypot(x - spawn.cx, y - spawn.cy) < 3) continue;
            floors.push({ x, y });
          }
        }
        Phaser.Utils.Array.Shuffle(floors);
        const count = Math.min(Phaser.Math.Between(3, 6), floors.length);
        for (let i = 0; i < count; i++) {
          const { x, y } = floors[i];
          this.spawnChest(x * CELL + CELL / 2, y * CELL + CELL / 2);
        }
      }

      spawnChest(x, y) {
        const chest = this.add
          .sprite(x, y, "chest", 0)
          .setDepth(8)
          .setScale(0.7);
        chest.opened = false;
        this.chests.push(chest);
        return chest;
      }

      // Devuelve el cofre cerrado bajo el punto clickeado, si el jugador está cerca.
      getChestAtPoint(wp) {
        for (const chest of this.chests || []) {
          if (!chest.active || chest.opened) continue;
          if (Math.abs(wp.x - chest.x) > 24 || Math.abs(wp.y - chest.y) > 24)
            continue;
          if (
            Math.hypot(this.player.x - chest.x, this.player.y - chest.y) <= 80
          )
            return chest;
        }
        return null;
      }

      // Abre el cofre: sprite abierto + destello + loot random como badges en el suelo.
      openChest(chest) {
        if (!chest || chest.opened) return;
        chest.opened = true;
        chest.setFrame(1);
        this.chestFlash(chest.x, chest.y);

        // Loot: items + un badge de oro, todos dispersos alrededor del cofre.
        const items = this.rollChestLoot();
        const gold = Phaser.Math.Between(10, 60);
        const drops = items.length + 1;
        const scatter = (i, fn) => {
          const ang =
            (i / drops) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.35, 0.35);
          const r = 30 + Phaser.Math.Between(0, 10);
          fn(chest.x + Math.cos(ang) * r, chest.y + Math.sin(ang) * r);
        };
        items.forEach((item, i) =>
          scatter(i, (x, y) => this.dropItemBadge(item, x, y)),
        );
        scatter(items.length, (x, y) => this.dropGoldBadge(gold, x, y));
      }

      // Destello: círculo aditivo que se expande y se desvanece.
      chestFlash(x, y) {
        const flash = this.add
          .circle(x, y - 6, 10, 0xffffff, 0.9)
          .setDepth(20)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: flash,
          scale: 4,
          alpha: 0,
          duration: 320,
          ease: "Quad.easeOut",
          onComplete: () => flash.destroy(),
        });
      }

      // Loot random: 1-3 items. Cada uno es una INSTANCIA generada con rollItem
      // (copia base + 1..5 mods rolleados de su pool propio), así el mismo item
      // sale distinto en cada cofre.
      rollChestLoot() {
        const n = Phaser.Math.Between(1, 3);
        const loot = [];
        for (let i = 0; i < n; i++) {
          const tpl = Phaser.Utils.Array.GetRandom(item_list);
          loot.push(rollItem(tpl.id) || tpl);
        }
        return loot;
      }

      // Badge en el suelo con el nombre del item (aparece con un pop).
      // Crea un badge de loot en el suelo (item u oro). Aparece con un pop.
      makeLootBadge(
        label,
        x,
        y,
        { border = 0xfbbf24, color = "#f8fafc" } = {},
      ) {
        if (!this.chestLoot) this.chestLoot = [];
        const text = this.add
          .text(0, 0, label, {
            // Misma fuente que la UI/stats del inventario, y resolución alta para
            // que no se vea borroso bajo el zoom de la cámara (ZOOM).
            fontFamily: '"Pixelify Sans", system-ui, sans-serif',
            fontSize: "7px",
            color,
            resolution: Math.ceil(ZOOM * (window.devicePixelRatio || 1)),
          })
          .setOrigin(0.5);
        const w = Math.ceil(text.width) + 8;
        const h = Math.ceil(text.height) + 4;
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.92);
        bg.fillRect(-w / 2, -h / 2, w, h);
        bg.lineStyle(1, border, 0.9);
        bg.strokeRect(-w / 2, -h / 2, w, h);
        const badge = this.add
          .container(x, y, [bg, text])
          .setDepth(12)
          .setScale(0);
        this.tweens.add({
          targets: badge,
          scale: 1,
          duration: 180,
          ease: "Back.easeOut",
        });
        this.chestLoot.push(badge);
        return badge;
      }

      // Color del badge según el item:
      //   jewel -> amarillo · skill (book_*) -> verde · resto por # de stats:
      //   0 -> blanco · 1-3 -> azul · 4-5 -> turquesa.
      lootColor(item) {
        if (item.type === "jewel")
          return { color: "#facc15", border: 0xfacc15 };
        if (item.type?.startsWith("book_"))
          return { color: "#4ade80", border: 0x4ade80 };
        const n = (item.mods || []).length;
        if (n >= 4) return { color: "#5eead4", border: 0x5eead4 }; // turquesa (4-5)
        if (n >= 1) return { color: "#60a5fa", border: 0x60a5fa }; // azul (1-3)
        return { color: "#f8fafc", border: 0x94a3b8 }; // blanco (0 stats)
      }

      // Tira al suelo un item que viene del inventario (App), cerca del jugador.
      dropWorldItem(item) {
        if (!item || !this.player) return;
        const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = 24 + Phaser.Math.Between(0, 8);
        this.dropItemBadge(
          item,
          this.player.x + Math.cos(ang) * r,
          this.player.y + Math.sin(ang) * r,
        );
      }

      // Badge de un item (nombre), coloreado por rareza. Al recogerlo va al inventario.
      dropItemBadge(item, x, y) {
        const badge = this.makeLootBadge(
          item.name || item.id,
          x,
          y,
          this.lootColor(item),
        );
        badge.itemId = item.id;
        badge.item = item; // instancia con mods rolleados (se guarda en el inventario)
        return badge;
      }

      // Badge de oro ("### Gold"): texto blanco, borde dorado.
      dropGoldBadge(amount, x, y) {
        const badge = this.makeLootBadge(`${amount} Gold`, x, y, {
          border: 0xfacc15,
          color: "#f8fafc",
        });
        badge.gold = amount;
        return badge;
      }

      // Devuelve el badge de loot bajo el punto clickeado si el jugador está cerca.
      getLootAtPoint(wp) {
        for (const badge of this.chestLoot || []) {
          if (!badge.active || badge.picked) continue;
          const b = badge.getBounds();
          if (
            wp.x < b.x - 4 ||
            wp.x > b.right + 4 ||
            wp.y < b.y - 4 ||
            wp.y > b.bottom + 4
          )
            continue;
          if (
            Math.hypot(this.player.x - badge.x, this.player.y - badge.y) <= 80
          )
            return badge;
        }
        return null;
      }

      // Recoge un item (click): lo suma al inventario vía onPickupItem. Si la
      // mochila está llena, el item se queda en el piso.
      pickupLoot(badge) {
        if (!badge || badge.picked) return;
        if (badge.gold) {
          onAddGold?.(badge.gold); // el oro no ocupa espacio de inventario
        } else {
          const ok = onPickupItem
            ? onPickupItem(badge.item || badge.itemId)
            : false;
          if (!ok) return; // mochila llena: el item se queda en el piso
        }
        badge.picked = true;
        const i = this.chestLoot.indexOf(badge);
        if (i >= 0) this.chestLoot.splice(i, 1);
        this.tweens.add({
          targets: badge,
          y: badge.y - 14,
          alpha: 0,
          duration: 180,
          onComplete: () => badge.destroy(),
        });
      }

      // Cursor "pointer" cuando el mouse está sobre un cofre o item interactuable
      // y el jugador está al lado (indica que se puede abrir / agarrar).
      updateCursor() {
        if (!this.player) return;
        const p = this.input.activePointer;
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        const cursor =
          this.getChestAtPoint(wp) || this.getLootAtPoint(wp)
            ? "pointer"
            : "default";
        if (cursor !== this._cursor) {
          this._cursor = cursor;
          this.input.setDefaultCursor(cursor);
        }
      }

      updateMobs() {
        if (!this.mobs) return;
        for (const mob of this.mobs.getChildren()) {
          if (!mob.active) continue;
          const cfg = MOBS[mob.mobType];
          if (!cfg) continue;
          const dx = this.player.x - mob.x;
          const dy = this.player.y - mob.y;
          const dist = Math.hypot(dx, dy);
          const aggro = cfg.aggroRange ?? 200;
          const chasing = dist <= aggro && dist > 4;

          if (chasing) {
            mob.setVelocity((dx / dist) * cfg.speed, (dy / dist) * cfg.speed);
            if (mob.anims.currentAnim?.key !== cfg.walk)
              mob.play(cfg.walk, true);
            mob.setFlipX(dx < 0);
          } else {
            mob.setVelocity(0, 0);
            if (mob.anims.currentAnim?.key !== cfg.idle)
              mob.play(cfg.idle, true);
          }

          this.updateMobHealthBar(mob);
        }
      }

      // Stats efectivas (base + equipo) que calcula React en combatRef; si aún
      // no llegó, usa las base de playerStats.
      stat(key) {
        const s = combatRef?.current?.stats || playerStats;
        return s[key] ?? playerStats[key] ?? 0;
      }

      // Daño de un golpe: la stat de daño según el arma/skill equipada (su tag).
      // Ej: book_dex con tag 'demonic' -> usa demonicDamage.
      attackDamage() {
        const type = combatRef?.current?.damageType || "physicalDamage";
        return this.stat(type);
      }

      // Elemento del ataque actual, derivado del stat de daño en uso quitando el
      // sufijo "Damage". Coincide con las keys de mob.resistences y con el caso
      // especial "physical" (que usa defensa en lugar de resistencia).
      // Ej: "fireDamage" -> "fire", "physicalDamage" -> "physical".
      attackElement() {
        const type = combatRef?.current?.damageType || "physicalDamage";
        return type.replace(/Damage$/, "");
      }

      // Aplica daño al mob teniendo en cuenta el tipo de ataque del player:
      // - physical: lo mitiga la defensa del mob (retornos decrecientes).
      // - resto (fire/cold/lightning/sacred/demonic): lo reduce la resistencia
      //   del mob a ese elemento (en %).
      damageMob(mob, amount, element = this.attackElement()) {
        const bar = mob.hpBar;
        if (!bar || !mob.active) return;

        let dealt;
        if (element === "physical") {
          const def = mob.defense || 0;
          dealt = amount * (amount / (amount + def));
        } else {
          const res = mob.resistences?.[element] || 0;
          dealt = amount * (1 - res / 100);
        }

        console.log("daniooo: ", mob, amount, element, dealt);

        bar.hp = Math.max(0, bar.hp - Math.max(0, dealt));
        this.updateMobHealthBar(mob);
        if (bar.hp <= 0) this.killMob(mob);
      }

      killMob(mob) {
        // Oro al matar: muestra "+# gold" flotante (fade) y lo suma al contador.
        const goldCfg = MOBS[mob.mobType]?.gold;
        if (goldCfg && onAddGold) {
          const g = Phaser.Math.Between(goldCfg.min, goldCfg.max);
          if (g > 0) {
            onAddGold(g);
            this.floatingText(mob.x, mob.y + MOB_HP_BAR_OFFSET_Y, `+${g} gold`);
          }
        }
        mob.hpBar?.bg?.destroy();
        mob.hpBar?.fill?.destroy();
        mob.hpBar = null;
        mob.destroy();
      }

      // Texto flotante que sube y se desvanece (feedback de oro al matar).
      floatingText(x, y, label, color = "#fde047") {
        const t = this.add
          .text(x, y, label, {
            fontFamily: '"Pixelify Sans", system-ui, sans-serif',
            fontSize: "9px",
            color,
            stroke: "#000000",
            strokeThickness: 2,
            resolution: Math.ceil(ZOOM * (window.devicePixelRatio || 1)),
          })
          .setOrigin(0.5)
          .setDepth(21);
        this.tweens.add({
          targets: t,
          y: y - 24,
          alpha: 0,
          duration: 700,
          ease: "Quad.easeOut",
          onComplete: () => t.destroy(),
        });
      }

      // El golpe solo cuenta si el mob toca la MEDIA LUNA visible del tajo, no el
      // bounding box del sprite. La geometría coincide con la textura 'slash':
      // un arco de radio exterior R y grosor T, con abertura ±SLASH_HALF_ARC
      // alrededor de la dirección del tajo. Escalamos por el tamaño actual del
      // sprite (crece/barre en el tween) para que el área de daño siga exactamente
      // a la animación cuadro a cuadro.
      checkSlashHits() {
        if (!this.mobs || !this.activeSlashes?.length) return;
        const R = 44; // radio exterior (igual que la textura 'slash')
        const T = 10; // grosor máximo de la banda
        const SLASH_HALF_ARC = Phaser.Math.DegToRad(54);
        for (const slash of this.activeSlashes) {
          if (!slash.active) continue;
          const scale = slash.scaleX || 0;
          const outer = R * scale;
          const inner = (R - T) * scale;
          for (const mob of this.mobs.getChildren()) {
            if (!mob.active) continue;
            if (slash.hitMobs?.has(mob)) continue;

            // Centro y radio aproximado del mob (su cuerpo de colisión) como
            // tolerancia de "contacto".
            const body = mob.body;
            const mobR = body
              ? Math.max(body.width, body.height) / 2
              : (mob.displayWidth || 24) / 2;
            const mcx = body ? body.center.x : mob.x;
            const mcy = body ? body.center.y : mob.y;

            const dx = mcx - slash.x;
            const dy = mcy - slash.y;
            const dist = Math.hypot(dx, dy);

            // 1) Distancia dentro de la banda de la media luna (con tolerancia).
            if (dist > outer + mobR || dist < inner - mobR) continue;

            // 2) Dentro de la abertura angular del tajo (su rotación actual).
            const angTo = Math.atan2(dy, dx);
            const angDelta = Math.abs(
              Phaser.Math.Angle.Wrap(angTo - slash.rotation),
            );
            const angTol = Math.atan2(mobR, Math.max(dist, 1));
            if (angDelta > SLASH_HALF_ARC + angTol) continue;

            if (!slash.hitMobs) slash.hitMobs = new Set();
            slash.hitMobs.add(mob);
            this.damageMob(mob, this.attackDamage());
          }
        }
      }

      // Cambia el personaje (sprites, escala y cuerpo de colisión).
      applyCharacter(key) {
        const c = CHARACTERS[key] || CHARACTERS.soldier;
        this.activeChar = key;
        this.player.setScale(c.scale);
        this.player.setTexture(c.idle, 0);
        this.player.body.setSize(c.body.w, c.body.h);
        this.player.body.setOffset(c.body.ox, c.body.oy);
        this.player.play(c.idle);
      }

      // SHOOT VOLLEY ARROWS
      // Crea varias flechas en la direccion del ángulo dado.
      shootVolleyArrow(baseAngle) {
        const count = Math.max(1, this.stat("projectileCount") || 1);
        const spread = Phaser.Math.DegToRad(0);
        const start = baseAngle - (spread * (count - 1)) / 2;

        const spacing = 15; // Distancia en píxeles entre cada flecha
        const perpAngle = start + Math.PI / 2; // Dirección perpendicular a la trayectoria

        for (let i = 0; i < count; i++) {
          const magnitude = Math.ceil(i / 2) * spacing;
          const sign = i % 2 === 0 ? -1 : 1; // Puedes cambiar a (i % 2 === 0 ? 1 : -1) si prefieres arrancar por la izquierda
          const offset = i === 0 ? 0 : magnitude * sign;

          const posX = this.player.x + Math.cos(perpAngle) * offset;
          const posY = this.player.y + Math.sin(perpAngle) * offset;

          const arrow = this.projectiles.create(posX, posY, "arrow");
          arrow.setDepth(11).setRotation(start);
          arrow.body.setSize(14, 2, true);

          this.physics.velocityFromRotation(
            start,
            500 + (500 * this.stat("attackSpeed")) / 100,
            arrow.body.velocity,
          );

          // Se autodestruye a los 2s si no chocó nada.
          this.time.delayedCall(2000, () => arrow.active && arrow.destroy());
        }
      }

      // Dispara projectileCount flechas: la principal al ángulo dado y las
      // extra en abanico simétrico (pequeño ángulo entre cada una).
      // shootArrow(baseAngle) {
      //   const count = Math.max(1, this.stat("projectileCount") || 1);
      //   const spread = Phaser.Math.DegToRad(PROJECTILE_SPREAD_DEG);
      //   const start = baseAngle - (spread * (count - 1)) / 2;

      //   for (let i = 0; i < count; i++)
      //     this.fireArrow(start + i * spread, this.stat("attackSpeed"));
      // }
      shootArrow(baseAngle, proj = null) {
        const count = Math.max(1, this.stat("projectileCount") || 1);
        const pointer = this.input.activePointer;
        const cursor = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // 1. Distancia y ángulo directos hacia el cursor
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          cursor.x,
          cursor.y,
        );
        const cursorAngle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          cursor.x,
          cursor.y,
        );

        // 2. Rangos de distancia (en píxeles)
        const minDistance = 50; // Muy cerca del personaje
        const maxDistance = 400; // Lejos del personaje

        // 3. Apertura TOTAL del abanico (en radianes)
        // Cerca = 120° de apertura total | Lejos = 10° de apertura total
        const maxSpread = Phaser.Math.DegToRad(120);
        const minSpread = Phaser.Math.DegToRad(10);

        // 4. Interpolar el spread según la distancia
        const factor = Phaser.Math.Percent(distance, minDistance, maxDistance); // Devuelve 0.0 a 1.0
        const currentSpread = Phaser.Math.Linear(maxSpread, minSpread, factor);

        // 5. Calcular el ángulo inicial para centrar el abanico en el cursor
        // Si solo hay 1 proyectil, el paso (step) es 0 y va directo al cursor.
        const step = count > 1 ? currentSpread / (count - 1) : 0;
        const startAngle = cursorAngle - currentSpread / 2;

        // 6. Disparar los proyectiles en abanico
        for (let i = 0; i < count; i++) {
          const angle = count === 1 ? cursorAngle : startAngle + i * step;
          this.fireArrow(angle, this.stat("attackSpeed"), proj);
        }
      }

      // FIRE NORMAL AND EFFECT ARROW
      // fireArrow(angle, speed, proj = null) {
      //   const arrow = this.projectiles.create(
      //     this.player.x,
      //     this.player.y,
      //     "arrow",
      //   );

      //   let emitter = null;

      //   if (proj) {
      //     const color = proj?.color ?? 0xffffff;

      //     arrow.setTint(color);
      //     arrow.setBlendMode(Phaser.BlendModes.ADD);
      //     arrow.body.setSize(24, 12, true);
      //     arrow.setDepth(21).setRotation(angle);

      //     // 1. Crear el emisor de partículas para la estela
      //     emitter = this.add.particles(0, 0, "arrow", {
      //       speed: { min: 10, max: 30 },
      //       scale: { start: 0.4, end: 0 },
      //       alpha: { start: 0.6, end: 0 },
      //       tint: color,
      //       blendMode: Phaser.BlendModes.ADD,
      //       lifespan: 300, // Duración de cada partícula en ms
      //       frequency: 30, // Intervalo entre partículas en ms
      //       angle: { min: 0, max: 360 },
      //     });

      //     // 2. Hacer que el emisor siga a la flecha
      //     emitter.startFollow(arrow);
      //     emitter.setDepth(20); // Justo por debajo de la flecha
      //   } else {
      //     arrow.body.setSize(14, 2, true);
      //     arrow.setDepth(11).setRotation(angle);
      //   }

      //   this.physics.velocityFromRotation(
      //     angle,
      //     500 + (500 * speed) / 100,
      //     arrow.body.velocity,
      //   );

      //   // 3. Limpiar la flecha y el emisor cuando se destruya
      //   const destroyArrow = () => {
      //     if (!arrow.active) return;
      //     if (emitter) {
      //       emitter.stop(); // Deja de emitir
      //       // Espera a que desaparezcan las partículas activas antes de destruir el emisor
      //       this.time.delayedCall(300, () => emitter.destroy());
      //     }
      //     arrow.destroy();
      //   };

      //   // Se autodestruye a los 2s si no chocó nada
      //   this.time.delayedCall(2000, destroyArrow);

      //   // Opcional: Escuchar el evento de destrucción por si colisiona antes de los 2s
      //   arrow.once(Phaser.GameObjects.Events.DESTROY, () => {
      //     if (emitter && emitter.active) {
      //       emitter.stop();
      //       this.time.delayedCall(300, () => emitter.destroy());
      //     }
      //   });
      // }

      fireArrow(
        angle,
        speed,
        proj = null,
        x = null,
        y = null,
        pierced = false,
      ) {
        const arrow = this.projectiles.create(
          x ? x : this.player.x,
          y ? y : this.player.y,
          "arrow",
        );

        arrow.hasPierced = pierced;

        let emitter = null;

        if (proj) {
          const color = proj?.color ?? 0xffffff;

          arrow.setTint(color);
          arrow.setBlendMode(Phaser.BlendModes.ADD);
          arrow.body.setSize(14, 2, true);
          arrow.setDepth(21).setRotation(angle);

          // Distancia desde el centro del sprite hacia la punta
          const tipOffset = 8;
          const offsetX = Math.cos(angle) * tipOffset;
          const offsetY = Math.sin(angle) * tipOffset;

          // Convertir el ángulo de la flecha a grados para el cono de emisión
          const degrees = Phaser.Math.RadToDeg(angle);
          const oppositeAngle = degrees + 180; // La onda sale hacia atrás desde la punta

          emitter = this.add.particles(0, 0, "arrow", {
            speed: { min: 40, max: 120 }, // Salen despedidas hacia atrás
            scale: { start: 0.4, end: 0 }, // Nacen grandes en la punta y se encogen
            alpha: { start: 0.9, end: 0 },
            tint: [color, 0xffffff], // Mezcla el color con destellos blancos
            blendMode: Phaser.BlendModes.ADD,
            lifespan: 200, // Vida corta para que la onda permanezca pegada a la punta
            frequency: 15, // Alta frecuencia para dar densidad al nucleo del cometa

            // Cono de expulsión en forma de onda (30 grados de apertura)
            angle: { min: oppositeAngle - 15, max: oppositeAngle + 15 },

            // Rotación aleatoria de cada partícula para que no sea rígido
            rotate: { min: 0, max: 360 },
          });

          // Fijar el emisor a la punta de la flecha
          emitter.startFollow(arrow, offsetX, offsetY);
          emitter.setDepth(22); // Por encima de la flecha para cubrir la punta
        } else {
          arrow.body.setSize(14, 2, true);
          arrow.setDepth(11).setRotation(angle);
        }

        this.physics.velocityFromRotation(
          angle,
          500 + (500 * speed) / 100,
          arrow.body.velocity,
        );

        const destroyArrow = () => {
          if (!arrow.active) return;
          if (emitter) {
            emitter.stop();
            this.time.delayedCall(200, () => emitter.destroy());
          }
          arrow.destroy();
        };

        this.time.delayedCall(2000, destroyArrow);

        arrow.once(Phaser.GameObjects.Events.DESTROY, () => {
          if (emitter && emitter.active) {
            emitter.stop();
            this.time.delayedCall(200, () => emitter.destroy());
          }
        });
      }

      // Dispara projectileCount bolas de skill en abanico (igual que shootArrow).
      shootNormalBall(baseAngle, proj) {
        const count = Math.max(1, this.stat("projectileCount") || 1);
        const spread = Phaser.Math.DegToRad(PROJECTILE_SPREAD_DEG);
        const start = baseAngle - (spread * (count - 1)) / 2;
        for (let i = 0; i < count; i++)
          this.basicBall(start + i * spread, proj);
      }

      // Dispara projectileCount bolas de skill en abanico (igual que shootArrow).
      shootBalls(baseAngle, proj) {
        const count = Math.max(1, this.stat("projectileCount") || 1);
        const spread = Phaser.Math.DegToRad(PROJECTILE_SPREAD_DEG);
        const start = baseAngle - (spread * (count - 1)) / 2;
        for (let i = 0; i < count; i++) this.fireBall(start + i * spread, proj);
      }

      basicBall(angle, proj) {
        const ball = this.projectiles.create(
          this.player.x,
          this.player.y,
          "normalBall",
        );
        ball.setDepth(11);
        ball.setTint(proj?.color ?? 0xffffff);
        ball.setBlendMode(Phaser.BlendModes.ADD); // brillo tipo glow
        ball.body.setCircle(6, 2, 2);
        this.physics.velocityFromRotation(angle, 360, ball.body.velocity);
        this.time.delayedCall(2000, () => ball.active && ball.destroy());
      }

      // Crea una bola de skill (fuego/sombra/...) teñida con el color de la skill.
      // Reusa el grupo de proyectiles, así hereda el daño al mob y la destrucción
      // contra las paredes. El daño usa el elemento del ataque (attackElement()).
      fireBall(angle, proj) {
        const ball = this.projectiles.create(
          this.player.x,
          this.player.y,
          "ball",
        );
        ball.setDepth(11);
        ball.setTint(proj?.color ?? 0xffffff);
        ball.setBlendMode(Phaser.BlendModes.ADD); // brillo tipo glow
        ball.body.setCircle(6, 2, 2);
        this.physics.velocityFromRotation(angle, 360, ball.body.velocity);
        this.time.delayedCall(2000, () => ball.active && ball.destroy());
      }

      // Ataque: media luna que barre hacia el cursor y se desvanece.
      attack() {
        const now = this.time.now;
        if (now < this.nextAttack) return;
        this.nextAttack = now + 280; // cooldown

        const p = this.input.activePointer;
        const cursor = this.cameras.main.getWorldPoint(p.x, p.y);
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          cursor.x,
          cursor.y,
        );

        const weaponType = ITEM_TYPE[weaponRef?.current];
        console.log("ref", equipRef, equipRef?.current);

        // Con una skill de proyectil equipada, el ataque dispara sus bolas
        // (fuego/sombra/...) en vez del golpe cuerpo a cuerpo o la flecha.
        const proj = combatRef?.current?.projectile;
        if (proj && (weaponType === "wand" || !weaponType)) {
          this.shootBalls(angle, proj);
          return;
        }

        if (weaponType === "wand") {
          this.shootNormalBall(angle, proj);
          return;
        }

        // Con un arco equipado en la main hand, dispara una flecha.
        if (weaponType === "bow") {
          // this.shootArrow(angle)
          const skill = combatRef?.current?.skill;
          if (skill) {
            switch (skill.id) {
              case "skill_fireArrow":
              case "skill_lightningArrow":
                this.shootArrow(angle, proj);
                break;
              default:
                this.shootArrow(angle);
                break;
            }
          } else this.shootVolleyArrow(angle);
          return;
        }

        const finalScale = ATTACK_SCALE;

        // Con espada, el tajo se separa del personaje en la dirección del ataque.
        const off = weaponType === "sword" ? SWORD_ATTACK_OFFSET : 0;
        const offX = Math.cos(angle) * off;
        const offY = Math.sin(angle) * off;

        // Empieza diminuto (~1px) y crece hasta el tamaño final mientras barre.
        const slash = this.add
          .image(this.player.x + offX, this.player.y + offY, "slash")
          .setDepth(11)
          .setRotation(angle - 0.5)
          .setAlpha(0.95)
          .setScale(0.02);
        slash.offX = offX;
        slash.offY = offY;
        slash.hitMobs = new Set();
        this.activeSlashes.push(slash);

        const remove = () => {
          const i = this.activeSlashes.indexOf(slash);
          if (i >= 0) this.activeSlashes.splice(i, 1);
          slash.destroy();
        };

        this.tweens.add({
          targets: slash,
          scaleX: finalScale,
          scaleY: finalScale,
          rotation: angle + 0.5, // barrido
          duration: 130,
          ease: "Quad.easeOut",
          onComplete: () => {
            // Al llegar al tamaño final, se desvanece.
            this.tweens.add({
              targets: slash,
              alpha: 0,
              scaleX: finalScale * 1.12,
              scaleY: finalScale * 1.12,
              duration: 90,
              ease: "Quad.easeIn",
              onComplete: remove,
            });
          },
        });
      }

      // Dibuja un aro de fuego: lengüetas radiales que titilan con el tiempo.
      drawFireRing(cx, cy, t) {
        const g = this.fireRing;
        g.clear();
        const N = AURA_DENSITY;
        const fs = AURA_PARTICLE_SIZE;

        // Aro base encendido.
        g.lineStyle(Math.max(2, 4 * fs), 0xff7a1a, 0.4);
        g.strokeCircle(cx, cy, AURA_RADIUS);

        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          // Parpadeo orgánico: suma de senos por ángulo, animada con el tiempo.
          const flicker =
            0.5 +
            0.35 * Math.sin(a * 6 + t * 0.012) +
            0.25 * Math.sin(a * 11 - t * 0.018);
          const len = (7 + Math.max(0, flicker) * 15) * fs;
          const dx = Math.cos(a);
          const dy = Math.sin(a);
          // Lengüeta de llama: base amarilla -> punta roja, hacia afuera.
          g.fillStyle(0xffe066, 0.7);
          g.fillCircle(cx + dx * AURA_RADIUS, cy + dy * AURA_RADIUS, 6 * fs);
          g.fillStyle(0xff8a1a, 0.6);
          g.fillCircle(
            cx + dx * (AURA_RADIUS + len * 0.5),
            cy + dy * (AURA_RADIUS + len * 0.5),
            4.5 * fs,
          );
          g.fillStyle(0xff3300, 0.5);
          g.fillCircle(
            cx + dx * (AURA_RADIUS + len),
            cy + dy * (AURA_RADIUS + len),
            3 * fs,
          );
        }
      }

      update(time) {
        // Cambio de personaje en caliente (desde la selección en React).
        if (
          characterRef &&
          characterRef.current &&
          characterRef.current !== this.activeChar
        ) {
          this.applyCharacter(characterRef.current);
        }

        // Cambio de tipo de mapa desde el menú -> regenera con el nuevo tema.
        if (mapThemeRef && this.theme !== mapThemeRef.current) {
          this.generate();
          return;
        }

        // Modo de visión reducida (niebla de guerra): toggleable desde el menú
        // de pruebas. Cuando está apagado, se oculta la capa de niebla (se ve
        // todo el mapa); cuando está prendido, se mantiene la visión limitada.
        if (this.fog) {
          this.fog.setVisible(
            reducedVisionRef ? reducedVisionRef.current !== false : true,
          );
        }

        const char = CHARACTERS[this.activeChar];

        const { W, A, S, D } = this.keys;
        let vx = 0;
        let vy = 0;
        if (A.isDown) vx -= 1;
        if (D.isDown) vx += 1;
        if (W.isDown) vy -= 1;
        if (S.isDown) vy += 1;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy);
          // movementSpeed es un % de aumento sobre el SPEED base (0 = sin bono).
          const speed = SPEED * (1 + this.stat("movementSpeed") / 100);
          this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
          if (this.player.anims.currentAnim?.key !== char.walk)
            this.player.play(char.walk, true);
        } else {
          this.player.setVelocity(0, 0);
          if (this.player.anims.currentAnim?.key !== char.idle)
            this.player.play(char.idle, true);
        }

        // El personaje siempre mira hacia el cursor (izquierda/derecha),
        // independientemente de la dirección en que se mueva.
        const pointer = this.input.activePointer;
        const cursor = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.setFlipX(cursor.x < this.player.x);

        // Los ataques activos siguen al personaje (con su offset) mientras se animan.
        for (const sl of this.activeSlashes)
          sl.setPosition(
            this.player.x + (sl.offX || 0),
            this.player.y + (sl.offY || 0),
          );
        this.checkSlashHits();

        // El aura (relleno + aro de fuego) sigue al player.
        if (this.auraOn) {
          this.auraFill.setPosition(this.player.x, this.player.y);
          this.drawFireRing(this.player.x, this.player.y, time);
        }

        this.updateEquip();
        this.updateMobs();
        this.updateCursor();
        this.reveal();
      }

      // Muestra/oculta los overlays de los items equipados (en cada slot) y los
      // mantiene encima del personaje. Un item sin animación simplemente no se ve.
      updateEquip() {
        const eq = (equipRef && equipRef.current) || {};
        const charScale = CHARACTERS[this.activeChar].scale;
        for (const slot of Object.keys(eq)) {
          const itemType = eq[slot] || null;
          const cfg = itemType ? EQUIP_ANIMS[itemType] : null;
          const key = `equip-${itemType}`;
          const playable = cfg && this.anims.exists(key); // textura cargada y anim lista
          let ov = this.equipOverlays[slot];

          if (playable) {
            if (!ov) {
              ov = this.add.sprite(0, 0, key).setDepth(12);
              this.equipOverlays[slot] = ov;
            }
            if (this.equipState[slot] !== itemType) {
              ov.setTexture(key).play(key).setVisible(true);
              this.equipState[slot] = itemType;
            }
            ov.setPosition(this.player.x, this.player.y);
            ov.setScale(cfg.scale != null ? cfg.scale : charScale);
            ov.setFlipX(this.player.flipX);
          } else if (ov && ov.visible) {
            ov.setVisible(false).stop();
            this.equipState[slot] = null;
          }
        }
      }

      // Descubre el mapa alrededor del jugador (niebla + grilla descubierta).
      reveal() {
        if (!this.discovered) return;
        const px = this.player.x;
        const py = this.player.y;
        // Borra la niebla con el pincel radial centrado en el jugador.
        this.fog.erase("fogBrush", px - REVEAL_PX, py - REVEAL_PX);
        // Marca como descubiertas las celdas dentro del radio.
        const ccx = Math.floor(px / CELL);
        const ccy = Math.floor(py / CELL);
        for (let dy = -REVEAL_CELLS; dy <= REVEAL_CELLS; dy++) {
          for (let dx = -REVEAL_CELLS; dx <= REVEAL_CELLS; dx++) {
            const x = ccx + dx;
            const y = ccy + dy;
            if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
            if (dx * dx + dy * dy <= REVEAL_CELLS * REVEAL_CELLS)
              this.discovered[y][x] = true;
          }
        }
      }
    }

    // Escena de UI (minimapa) separada, sin el zoom de la cámara del juego.
    class UIScene extends Phaser.Scene {
      constructor() {
        super("ui");
      }
      create() {
        this.dungeon = this.scene.get("dungeon");
        this.g = this.add.graphics();
      }
      layout() {
        const pad = 14;
        const scale = MINIMAP_W / WORLD_W;
        const w = WORLD_W * scale;
        const h = WORLD_H * scale;
        return { scale, w, h, x: this.scale.width - w - pad, y: pad };
      }
      update() {
        const d = this.dungeon;
        const g = this.g;
        g.clear();
        if (!d || !d.discovered) return;
        const { scale, x, y, w, h } = this.layout();
        const cs = Math.ceil(CELL * scale);

        g.fillStyle(0x0a0e1a, 0.75);
        g.fillRect(x, y, w, h);

        for (let cy = 0; cy < ROWS; cy++) {
          for (let cx = 0; cx < COLS; cx++) {
            if (!d.discovered[cy][cx]) continue;
            if (d.role[cy][cx])
              g.fillStyle(0x9aa3b2, 1); // pared
            else if (d.grid[cy][cx] === 1)
              g.fillStyle(0x39414f, 1); // suelo
            else continue;
            g.fillRect(x + cx * CELL * scale, y + cy * CELL * scale, cs, cs);
          }
        }

        // Marcador del jugador.
        g.fillStyle(0xffd23f, 1);
        g.fillCircle(x + d.player.x * scale, y + d.player.y * scale, 3);
        // Borde.
        g.lineStyle(2, 0x9aa3b2, 0.6);
        g.strokeRect(x, y, w, h);
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || window.innerWidth,
      height: containerRef.current.clientHeight || window.innerHeight,
      backgroundColor: "#0c0f12",
      scene: [DungeonScene, UIScene],
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      scale: {
        // RESIZE: el canvas ocupa todo el contenedor (sin barras ni escalado).
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    gameRef.current = game;

    // El layout cambia al abrir/cerrar paneles: ajustamos el canvas al contenedor.
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width && height) game.scale.resize(width, height);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return <div ref={containerRef} className="phaser-container" />;
}
