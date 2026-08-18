// Info general del personaje (clase, nivel, experiencia).
export const playerInfo = {
  name: "Soldier",
  class: "Warrior",
  level: 1,
  exp: 65,
  expToNext: 100,
  inventoryItems: [
    "sword_01",
    "sword_01",
    "shield_10",
    "jewel_01",
    "bow",
    "skill_fireball",
    "skill_shadowball",
    "wand_00",
    "skill_lightningArrow3",
  ],
};

export const playerStats = {
  hp: 100,
  mp: 50,

  demonicShield: 0,
  sacredShield: 0,

  hpRegen: 0,
  mpRegen: 0,
  demonicRegen: 0,
  sacredRegen: 0,

  hpLeechOnHit: 0,
  hpLeechOnKill: 0,
  hpLeechOnDamageTaken: 0,
  mpLeechOnHit: 0,
  mpLeechOnKill: 0,
  mpLeechOnDamageTaken: 0,

  chanceToEvade: 0,

  fireResist: 0,
  coldResist: 0,
  lightningResist: 0,
  sacredResist: 0,
  demonicResist: 0,

  physicalDamage: 10,
  fireDamage: 0,
  coldDamage: 0,
  lightningDamage: 0,
  sacredDamage: 0,
  demonicDamage: 0,

  attackSpeed: 10,

  defense: 8,
  blockChance: 10,

  movementSpeed: 10,

  critChance: 5,
  critDamage: 50,

  areaDamage: 0,
  areaRadius: 0,

  damageOverTime: 0,
  damageOverTimeDuration: 0,

  damageReduction: 0,
  damageReflection: 0,

  projectileCount: 1,
  pierceCount: 0,
};

// const weaponModifiers = {
//   demonic: [
//     {
//       stat: '+# to demonic damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   sacred: [
//     {
//       stat: '+# to sacred damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   elemental: [
//     {
//       stat: '+# to elemental damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   physical: [
//     {
//       stat: '+# to physical damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   fire: [
//     {
//       stat: '+# to fire damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   ice: [
//     {
//       stat: '+# to ice damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   lightning: [
//     {
//       stat: '+# to lightning damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   poison: [
//     {
//       stat: '+# to poison damage',
//       low: [10, 50],
//       mid: [60, 100],
//       high: [150, 300]
//     },
//   ],
//   general: [
//     {
//       stat: '#% increased attack speed',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },
//     {
//       stat: '#% increased damage',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },
//     {
//       stat: '#% increased movement speed',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },
//     {
//       stat: '#% increased critical chance',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },
//     {
//       stat: '#% increased critical damage',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },
//     {
//       stat: '#% increased area damage',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },
//     {
//       stat: '#% increased damage over time',
//       low: [5, 10],
//       mid: [15, 30],
//       high: [40, 50]
//     },

//   ],
// }

// const shieldModifiers = {
//   generalFlat: [
//     {
//       stat: '+# to defense',
//       low: [10, 100],
//       mid: [120, 400],
//       high: [500, 1000]
//     },
//     {
//       stat: '+# to life',
//       low: [10, 100],
//       mid: [120, 400],
//       high: [500, 1000]
//     },

//   ],
//   generalPercentage: [
//     {
//       stat: '#% increased damage reduction',
//       low: [2, 7],
//       mid: [10, 15],
//       high: [20, 30]
//     },
//     {
//       stat: '#% increased damage reflection',
//       low: [2, 7],
//       mid: [10, 15],
//       high: [20, 30]
//     },
//     {
//       stat: '#% increased block chance',
//       low: [5, 15],
//       mid: [20, 40],
//       high: [50, 75]
//     },
//   ]
// }

// // si no tenes skill equipada usa siempre physical dmg, sino la skill define que tipo de dmg haces, las armas y quipo solo cambian los stats

// /**
//  *              hp    mp    %hp  %mp
//  * armor        250   300   100  100
//  * helmet       150   150   20   20
//  * gloves       100   150   20   20
//  * boots        100   150   20   20
//  * main hand    0     0
//  * off hand     100   250   40   40
//  * wings        300   200   100  100
//  * rings        200   300   60   60
//  * pendant      200   300   60   60
//  * charm        100   200   40   40
//  * relic        100   250   40   40
//  * TOTAL        1600  2500  500  500
//  *
//  */
