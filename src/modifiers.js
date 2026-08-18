// ---------------------------------------------------------------------------
// Catálogo de modificadores que un item puede "rollear" al dropear.
//
// Cada modificador define:
//   - stat:  la key de playerStats (stats.js) que afecta al equiparse.
//   - mode:  cómo aplica su valor sobre esa stat:
//              'flat'      -> suma el valor (ej: +12 to physical damage)
//              'increased' -> % que se acumula y multiplica la stat
//   - label: texto para mostrar; '#' se reemplaza por el valor rolleado.
//   - tiers: varios rangos [min, max] por rareza. Al rollear se elige un tier
//            (low/mid/high, con pesos) y luego un valor entero dentro del rango.
//
// La idea: un único diccionario reutilizable. Cada item (items.js) referencia
// por key la lista de mods que PUEDE tener; así tenés varias opciones por item
// y varios rangos de valores por opción sin duplicar nada.
// ---------------------------------------------------------------------------
export const MODIFIERS = {
  // --- Ofensivos (armas) ---
  flat_phys: {
    stat: "physicalDamage",
    mode: "flat",
    label: "+# to physical damage",
    tiers: { low: [3, 12], mid: [15, 40], high: [50, 90] },
  },
  flat_fire: {
    stat: "fireDamage",
    mode: "flat",
    label: "+# to fire damage",
    tiers: { low: [3, 12], mid: [15, 40], high: [50, 90] },
  },
  flat_cold: {
    stat: "coldDamage",
    mode: "flat",
    label: "+# to cold damage",
    tiers: { low: [3, 12], mid: [15, 40], high: [50, 90] },
  },
  flat_light: {
    stat: "lightningDamage",
    mode: "flat",
    label: "+# to lightning damage",
    tiers: { low: [3, 12], mid: [15, 40], high: [50, 90] },
  },
  flat_sacred: {
    stat: "sacredDamage",
    mode: "flat",
    label: "+# to sacred damage",
    tiers: { low: [3, 12], mid: [15, 40], high: [50, 90] },
  },
  flat_demonic: {
    stat: "demonicDamage",
    mode: "flat",
    label: "+# to demonic damage",
    tiers: { low: [3, 12], mid: [15, 40], high: [50, 90] },
  },
  inc_atkspd: {
    stat: "attackSpeed",
    mode: "increased",
    label: "#% increased attack speed",
    tiers: { low: [3, 8], mid: [10, 18], high: [22, 35] },
  },
  inc_crit: {
    stat: "critChance",
    mode: "increased",
    label: "#% increased critical chance",
    tiers: { low: [5, 10], mid: [12, 25], high: [30, 50] },
  },
  inc_critdmg: {
    stat: "critDamage",
    mode: "increased",
    label: "#% increased critical damage",
    tiers: { low: [5, 15], mid: [20, 40], high: [50, 90] },
  },
  flat_proj: {
    stat: "projectileCount",
    mode: "flat",
    label: "+# to number of projectiles",
    tiers: { low: [1, 1], mid: [2, 3], high: [4, 5] },
  },
  flat_pierce: {
    stat: "pierceCount",
    mode: "flat",
    label: "Projectiles can pierce # times",
    tiers: { low: [1, 1], mid: [2, 3], high: [4, 5] },
  },

  // --- Defensivos (escudos / equipo) ---
  flat_def: {
    stat: "defense",
    mode: "flat",
    label: "+# to defense",
    tiers: { low: [8, 30], mid: [40, 120], high: [150, 350] },
  },
  inc_def: {
    stat: "defense",
    mode: "increased",
    label: "#% increased defense",
    tiers: { low: [5, 10], mid: [15, 40], high: [50, 100] },
  },
  inc_evasion: {
    stat: "chanceToEvade",
    mode: "increased",
    label: "#% increased block chance",
    tiers: { low: [3, 8], mid: [10, 20], high: [25, 45] },
  },
  inc_block: {
    stat: "blockChance",
    mode: "increased",
    label: "#% increased block chance",
    tiers: { low: [3, 8], mid: [10, 20], high: [25, 45] },
  },
  inc_dmgred: {
    stat: "damageReduction",
    mode: "increased",
    label: "#% damage decreased",
    tiers: { low: [2, 6], mid: [8, 14], high: [18, 30] },
  },
  inc_dmgref: {
    stat: "damageReflection",
    mode: "increased",
    label: "#% damage reflected",
    tiers: { low: [2, 6], mid: [8, 14], high: [18, 30] },
  },

  // --- Generales (pueden ir en cualquier item) ---
  inc_hp: {
    stat: "hp",
    mode: "increased",
    label: "#% increased life",
    tiers: { low: [5, 10], mid: [15, 25], high: [30, 50] },
  },
  inc_mp: {
    stat: "mp",
    mode: "increased",
    label: "#% increased mana",
    tiers: { low: [5, 10], mid: [15, 25], high: [30, 50] },
  },
  inc_sacredShield: {
    stat: "ss",
    mode: "increased",
    label: "#% increased sacred shield",
    tiers: { low: [5, 10], mid: [15, 25], high: [30, 50] },
  },
  inc_demonicShield: {
    stat: "ds",
    mode: "increased",
    label: "#% increased demonic shield",
    tiers: { low: [5, 10], mid: [15, 25], high: [30, 50] },
  },
  flat_hp: {
    stat: "hp",
    mode: "flat",
    label: "+# to life",
    tiers: { low: [10, 40], mid: [50, 120], high: [150, 300] },
  },
  flat_mp: {
    stat: "mp",
    mode: "flat",
    label: "+# to mana",
    tiers: { low: [5, 25], mid: [30, 80], high: [100, 200] },
  },
  flat_sacredShield: {
    stat: "ss",
    mode: "flat",
    label: "+# to sacred shield",
    tiers: { low: [5, 25], mid: [30, 80], high: [100, 200] },
  },
  flat_demonicShield: {
    stat: "ds",
    mode: "flat",
    label: "+# to demonic shield",
    tiers: { low: [5, 25], mid: [30, 80], high: [100, 200] },
  },
  inc_ms: {
    stat: "movementSpeed",
    mode: "increased",
    label: "#% increased movement speed",
    tiers: { low: [3, 8], mid: [10, 18], high: [22, 35] },
  },
};

// Agrupaciones para armar el pool de cada item fácil (spread en items.js).
export const SWORD_MODS = [
  "flat_phys",
  "flat_fire",
  "flat_cold",
  "flat_light",
  "flat_sacred",
  "flat_demonic",
  "inc_atkspd",
  "inc_crit",
  "inc_critdmg",
];
export const BOW_MODS = [
  "flat_phys",
  "flat_fire",
  "flat_cold",
  "flat_light",
  "flat_sacred",
  "flat_demonic",
  "inc_atkspd",
  "inc_crit",
  "inc_critdmg",
  "flat_proj",
  "flat_pierce",
];
export const EQUIPMENT_MODS = [
  "flat_def",
  "flat_hp",
  "flat_mp",
  "flat_sacredShield",
  "flat_demonicShield",
  "inc_ms",
  "inc_hp",
  "inc_mp",
  "inc_sacredShield",
  "inc_demonicShield",
];
export const SHIELD_MODS = [
  "flat_def",
  "inc_block",
  "inc_dmgred",
  "flat_hp",
  "flat_mp",
  "flat_sacredShield",
  "flat_demonicShield",
  "inc_hp",
  "inc_mp",
  "inc_sacredShield",
  "inc_demonicShield",
];
// Hachas: mismo pool ofensivo que las espadas (armas cuerpo a cuerpo).
export const AXE_MODS = [...SWORD_MODS];
// Mazas: ofensivo + algo de defensa (son armas contundentes/pesadas).
export const MACE_MODS = [...SWORD_MODS];
// Ballestas: mismo pool que los arcos (proyectiles).
export const CROSSBOW_MODS = [...BOW_MODS];
// Carcaj (off hand de arquero): todo lo que mejora los proyectiles.
export const QUIVER_MODS = [
  "flat_phys",
  "flat_fire",
  "flat_cold",
  "flat_light",
  "flat_proj",
  "flat_pierce",
  "inc_atkspd",
  "inc_crit",
  "inc_critdmg",
  "flat_hp",
  "flat_mp",
  // flat_res
];
// Bastones (2 manos, casteo): ofensivo + maná + proyectiles.
export const STAFF_MODS = [...BOW_MODS, "flat_mp"];
// Cetros (1 mano, casteo): ofensivo + maná + crítico.
export const SCEPTER_MODS = [...BOW_MODS, "flat_mp"];
// Varitas: igual que los cetros pero más ligeros (ya usaban BOW_MODS).
export const WAND_MODS = [...BOW_MODS, "flat_mp"];
// Armadura de torso: defensivo + generales.
export const ARMOR_MODS = ["flat_def", "inc_dmgred", ...EQUIPMENT_MODS];
// Tomos pasivos (slot de habilidad): sólo mejoras generales.
export const TOME_MODS = [...EQUIPMENT_MODS];

// Cada `tag` de daño mapea a la stat de daño de playerStats correspondiente.
// Sirve para dos cosas: 1) sumar el base.damage de un item a esa stat al
// equiparlo; 2) elegir qué stat de daño usa el personaje para atacar (según
// el tag del arma/skill equipada en main hand).
export const TAG_TO_DAMAGE = {
  physical: "physicalDamage",
  fire: "fireDamage",
  cold: "coldDamage",
  lightning: "lightningDamage",
  sacred: "sacredDamage",
  demonic: "demonicDamage",
};

// Atributos de `base` que suman DIRECTO a la stat homónima de playerStats al
// equipar el item (`damage` va aparte: se enruta por el `tag` del item, y
// `requiredLevel` es sólo informativo para el tooltip).
const BASE_STAT_KEYS = [
  "defense",
  "blockChance",
  "attackSpeed",
  "critChance",
  "critDamage",
  "projectileCount",
  "pierceCount",
  "movementSpeed",
  "damageReduction",
  "hp",
  "mp",
];

// Pesos de rareza por tier (más probable low, raro high).
const TIER_WEIGHTS = [
  ["low", 0.6],
  ["mid", 0.3],
  ["high", 0.1],
];

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const pickTier = (tiers) => {
  const avail = TIER_WEIGHTS.filter(([t]) => tiers[t]);
  const total = avail.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of avail) {
    r -= w;
    if (r <= 0) return t;
  }
  return avail[0][0];
};

// Barajado no destructivo (Fisher-Yates sobre una copia).
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Rollea UN modificador por su key: elige tier y valor dentro del rango.
// Devuelve una instancia con todo lo necesario para mostrar y aplicar.
export function rollMod(key) {
  const def = MODIFIERS[key];
  if (!def) return null;
  const tier = pickTier(def.tiers);
  const [lo, hi] = def.tiers[tier];
  const value = randInt(lo, hi);
  return {
    key,
    tier,
    value,
    stat: def.stat,
    mode: def.mode,
    label: def.label.replace("#", value),
  };
}

// Cuántos mods rollear para un item: entero al azar en [min, max].
export const modCount = (min, max) => randInt(min, max);

// Aplica los mods de los items equipados sobre una copia de las stats base.
// 'flat' suma; 'increased' se acumula como % y se multiplica al final.
export function computeStats(baseStats, equipped = []) {
  const stats = { ...baseStats };
  const pct = {}; // stat -> suma de % increased

  for (const item of equipped) {
    if (!item) continue;
    // 1) Atributos base del item -> stats. El base.damage va a la stat de daño
    //    que indica el `tag` (físico/fuego/etc.); defensa/bloqueo suman directo.
    const b = item.base;
    if (b) {
      const dmgStat = TAG_TO_DAMAGE[item.tag];
      if (b.damage && dmgStat)
        stats[dmgStat] = (stats[dmgStat] || 0) + b.damage;
      // El resto de los atributos base suman a la stat del mismo nombre
      // (defensa/bloqueo, pero también velocidad de ataque, proyectiles, etc.
      // que es lo que diferencia a un hacha lenta de una espada rápida).
      for (const key of BASE_STAT_KEYS) {
        if (b[key]) stats[key] = (stats[key] || 0) + b[key];
      }
    }
    // 2) Modificadores rolleados: 'flat' suma, 'increased' se acumula como %.
    // for (const m of item.mods || []) {
    //   if (m.mode === "flat") stats[m.stat] = (stats[m.stat] || 0) + m.value;
    //   else {
    //     console.log("value: ", m, pct, pct[m.stat], m.stat);
    //     pct[m.stat] = (pct[m.stat] || 0) + m.value;
    //   }
    // }
    if (item?.baseMods?.length)
      for (const m of item.baseMods) {
        stats[m.stat] = (stats[m.stat] || 0) + +m.value;
        // switch (m.stat) {
        //   case 'attackSpeed':
        //     stats[m.stat] = (stats[m.stat] || 0) + m.value;
        //     break;
        //   default:
        //     const total =
        //     stats[m.stat] = (stats[m.stat] || 0) + m.value;
        //     break;
        // }
      }
    for (const m of item.mods || []) {
      stats[m.stat] = (stats[m.stat] || 0) + m.value;
      // switch (m.stat) {
      //   case 'attackSpeed':
      //     stats[m.stat] = (stats[m.stat] || 0) + m.value;
      //     break;
      //   default:
      //     const total =
      //     stats[m.stat] = (stats[m.stat] || 0) + m.value;
      //     break;
      // }
    }
  }
  // for (const stat in pct) {
  //   stats[stat] = Math.round((stats[stat] || 0) * (1 + pct[stat] / 100));
  // }
  return stats;
}

// Stat de daño que usa el personaje para atacar, según el arma/skill de main
// hand (su `tag`). Sin tag válido -> daño físico.
export function attackDamageStat(mainHandItem) {
  return TAG_TO_DAMAGE[mainHandItem?.tag] || "physicalDamage";
}

// Skill de proyectil equipada (slots skill1..3): la primera que tenga
// `projectile`. Define el ataque a distancia y el daño principal.
export function activeSkill(slots) {
  return (
    [slots.skill1, slots.skill2, slots.skill3].find((s) => s?.projectile) ||
    null
  );
}

// Stat de daño principal del personaje: la skill de proyectil equipada tiene
// prioridad; si no, el tag del arma de main hand; por defecto, físico.
export function mainDamageStat(slots) {
  const skill = activeSkill(slots);
  return TAG_TO_DAMAGE[(skill || slots.weapon1)?.tag] || "physicalDamage";
}

// Helper para tooltips: lista de líneas legibles de una instancia.
export const describeMods = (item) => (item?.mods || []).map((m) => m.label);
