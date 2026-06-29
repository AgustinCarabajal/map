// Cada item tiene:
//   - id:   identificador único (define ícono /items/<id>.png y animación de
//           equipo assets/equip/<id>.png con su entrada en EQUIP_ANIMS).
//   - type: categoría de juego (sword / shield / bow / book_int / ...), define
//           en qué slot entra. Varios items pueden compartir type con distinto id.
export const item_list = [
  { id: 'sword_10', type: 'sword', name: 'Crimson Verdict',
    base: {
      damage: 50,
      attackSpeed: 1.2,
      requiredLevel: 5,
    },
    possibleMods: [
      '5% increased attack speed',
      '10% increased damage',
    ] },
  { id: 'sword_01', type: 'sword', name: 'Iron Sword',
    base: {
      damage: 18,
      attackSpeed: 1.0,
      requiredLevel: 1,
    },
    possibleMods: [
      '5% increased damage',
    ] },
  { id: 'shield_10', type: 'shield', name: 'Tower Shield',
    base: {
      defense: 30,
      blockChance: 25,
      requiredLevel: 2,
    },
    possibleMods: [
      '10% increased block chance',
    ] },
    { id: 'jewel_01', type: 'jewel', name: 'Void Shard',
    possibleMods: [
      'Used in crafting recipes',
    ] },
  { id: 'bow', type: 'bow', name: 'Whisperwind',
    base: {
      damage: 35,
      attackSpeed: 1.5,
      requiredLevel: 6,
    },
    possibleMods: [
      '15% increased attack speed',
      '20% chance to deal double damage',
    ] },
  { id: 'book_int', type: 'book_int', name: 'Astral Fracture',
    description: 'Cast a powerful spell that damages all enemies in a radius.',
    effects: ['Damage: 150% of your magic power', 'Cooldown: 20s'] },
  { id: 'book_dex', type: 'book_dex', name: 'Phantom Weave',
    description: 'Grants the ability to teleport a short distance, evading attacks.',
    effects: ['Teleport Range: 5 tiles', 'Cooldown: 15s'] },
  { id: 'book_str', type: 'book_str', name: 'Thunderwake',
    description: 'A manual of primal forces. Boosts attack power by 20% but decreases movement speed by 10%.',
    effects: ['Attack Power: +20%', 'Movement Speed: -10%'] },
]
