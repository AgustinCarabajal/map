// Configuración de enemigos: sprite, animación y stats de combate.
export const MOBS = {
  ghost: {
    texture: "ghost",
    idle: "ghost-idle",
    walk: "ghost-walk",
    frames: 3,
    animRate: 6,
    frameW: 64,
    frameH: 64,
    body: { w: 15, h: 23, ox: 24, oy: 21 },
    scale: 1.4,
    speed: 90,
    damage: 10,
    hp: 100,
    defense: 3,
    resistences: {
      fire: 10,
      cold: 10,
      lightning: 10,
      sacred: 0,
      demonic: 50,
    },
    aggroRange: 120,
    gold: { min: 3, max: 12 }, // oro que suelta al morir (rango aleatorio)
  },
};
