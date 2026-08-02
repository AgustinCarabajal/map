import { SWORD_MODS, SHIELD_MODS, BOW_MODS } from "./modifiers.js";

// Cada item tiene:
//   - id:   identificador único (define ícono /items/<id>.png y animación de
//           equipo assets/equip/<id>.png con su entrada en EQUIP_ANIMS).
//   - type: categoría de juego (sword / shield / bow / book_int / ...), define
//           en qué slot entra. Varios items pueden compartir type con distinto id.
//   - base: atributos base fijos del item (iguales en cada drop).
//   - mods: POOL propio de modificadores posibles (keys de MODIFIERS en
//           modifiers.js). Al dropear, rollItem() toma 1..5 de esta lista y les
//           rollea un valor -> así cada drop del mismo item sale distinto.
export const item_list = [
  {
    id: "wand_00",
    type: "wand",
    name: "Duelist Wand",
    version: "neon",
    base: {
      damage: 10,
      attackSpeed: 2,
      requiredLevel: 1,
    },
    mods: [...BOW_MODS],
    tag: "fire",
  },
  {
    id: "sword_10",
    type: "sword",
    name: "Crimson Verdict",
    base: {
      damage: 50,
      attackSpeed: 1.2,
      requiredLevel: 5,
    },
    mods: [...SWORD_MODS],
    tag: "fire",
  },
  {
    id: "sword_01",
    type: "sword",
    name: "Iron Sword",
    base: {
      damage: 18,
      attackSpeed: 1.0,
      requiredLevel: 1,
    },
    mods: [...SWORD_MODS],
    tag: "physical",
  },
  {
    id: "shield_10",
    type: "shield",
    name: "Tower Shield",
    base: {
      defense: 30,
      blockChance: 25,
      requiredLevel: 2,
    },
    version: "shiny",
    mods: [...SHIELD_MODS],
  },
  {
    id: "jewel_01",
    type: "jewel",
    name: "Void Shard",
    // Material de crafteo: no rollea mods.
    mods: [],
    tag: "misc",
  },
  {
    id: "bow",
    type: "bow",
    name: "Whisperwind",
    base: {
      damage: 35,
      attackSpeed: 1.5,
      requiredLevel: 6,
    },
    mods: [...BOW_MODS],
    tag: "physical",
  },
  // Skill de proyectil: al equiparla (slot skill) el ataque dispara bolas de
  // fuego, define el daño principal como fuego (por su `tag`) y suma su
  // base.damage (+10) al fireDamage (vía computeStats).
  {
    id: "skill_fireball",
    type: "book_str",
    name: "Fireball",
    description: "Lanza bolas de fuego hacia el cursor.",
    effects: ["Damage: +10 fire (flat)", "Sets main damage to Fire"],
    base: { damage: 10 },
    mods: [],
    tag: "fire",
    // `projectile` marca la skill como ataque a distancia y describe su visual.
    projectile: { color: 0xff7a1a },
    canBeUsedBy: ["empty", "wand", "staff"],
  },
  // Skill de proyectil demoníaco: dispara orbes de sombra violetas, define el
  // daño principal como demonic y suma +10 al demonicDamage.
  {
    id: "skill_shadowball",
    type: "book_int",
    name: "Shadow Orb",
    description: "Lanza orbes de sombra demoníaca hacia el cursor.",
    effects: ["Damage: +10 demonic (flat)", "Sets main damage to Demonic"],
    base: { damage: 10 },
    mods: [],
    tag: "demonic",
    projectile: { color: 0xa855f7 },
    canBeUsedBy: ["empty", "wand", "staff"],
  },
];
