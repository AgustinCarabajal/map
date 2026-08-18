import { item_list, makeItem } from "./items.js";
import { playerInfo } from "./stats.js";

export const ATTR_LABEL = {
  int: "Intelligence",
  dex: "Dexterity",
  str: "Strength",
};
export const ATTR_COLOR = { int: "#639bff", dex: "#51c96e", str: "#de3838" };

// "Tipo de equipo" (kind) de cada item, derivado de su `type`. Es lo que define
// en qué slot entra (ver EQUIP_SLOTS.accept):
//   sword/axe/mace/bow/crossbow/staff/scepter/wand -> arma (main hand)
//   shield/quiver -> off hand · armor -> torso · book_* -> habilidad
//   jewel y cualquier otro material -> sólo mochila/crafteo
const KIND_BY_TYPE = {
  shield: "shield",
  quiver: "quiver",
  armor: "armor",
  helmet: "helmet",
  gloves: "gloves",
  boots: "boots",
  amulet: "amulet",
  ring: "ring",
  wings: "wings",
  jewel: "material",
};

export function kindOf(type) {
  if (type.startsWith("book_")) return "skill";
  return KIND_BY_TYPE[type] || "weapon";
}

// Catálogo indexado por `id` (templates). Ícono/kind derivados.
export const ITEMS = item_list.reduce((map, it) => {
  map[it.id] = {
    ...it,
    kind: kindOf(it.type),
    attr: it.type.startsWith("book_") ? it.type.slice(5) : null, // int/dex/str
    img: `/items/${it.id}.png`,
  };
  return map;
}, {});

// Los slots guardan INSTANCIAS de item (con sus mods/tag rolleados). `hydrate`
// le agrega los campos de presentación (kind/attr/img) derivados del type/id.
export function hydrate(inst) {
  if (!inst) return null;
  return {
    ...inst,
    kind: kindOf(inst.type),
    attr: inst.type.startsWith("book_") ? inst.type.slice(5) : null,
    img: `/items/${inst.id}.png`,
  };
}

// Slots de equipo (orden = grilla 3x3). `accept` = kinds que admite.
export const EQUIP_SLOTS = [
  { id: "amulet", type: "amulet", accept: ["amulet"] },
  { id: "wings", type: "wings", accept: ["wings"] },
  { id: "ring", type: "ring", accept: ["ring"] },
  { id: "weapon1", type: "main hand", accept: ["weapon"] }, // arma o skill (define daño)
  { id: "helmet", type: "helmet", accept: ["helmet"] },
  { id: "weapon2", type: "off hand", accept: ["shield", "quiver"] }, // escudo o carcaj
  { id: "gloves", type: "gloves", accept: ["gloves"] },
  { id: "armor", type: "armor", accept: ["armor"] },
  { id: "boots", type: "boots", accept: ["boots"] },
  { id: "skill1", type: "skill", accept: ["skill"] },
  { id: "skill2", type: "skill", accept: ["skill"] },
  { id: "skill3", type: "skill", accept: ["skill"] },
];

export const BACKPACK_SIZE = 32;
export const EQUIP_IDS = new Set(EQUIP_SLOTS.map((s) => s.id));

// Mesa de crafteo: 3x3 de entrada + 1 de resultado.
export const CRAFT_SLOTS = Array.from({ length: 9 }, (_, i) => `c${i}`);
export const CRAFT_OUT = "out";

export function buildInitialSlots() {
  const slots = {};
  EQUIP_SLOTS.forEach((s) => (slots[s.id] = null));
  for (let i = 0; i < BACKPACK_SIZE; i++) slots[`bp${i}`] = null;
  CRAFT_SLOTS.forEach((id) => (slots[id] = null));
  slots[CRAFT_OUT] = null;
  // Items iniciales de la mochila: instancias base de playerInfo.inventoryItems.
  (playerInfo.inventoryItems || []).forEach((id, i) => {
    if (i < BACKPACK_SIZE) slots[`bp${i}`] = makeItem(id);
  });
  return slots;
}

// ¿Puede la instancia ir a ese slot? Equipo por kind; mochila/crafteo todo;
// el resultado del crafteo no admite que suelten items.
export function canPlace(item, slotId, level) {
  if (!item) return true;
  if (slotId === CRAFT_OUT) return false;
  const eq = EQUIP_SLOTS.find((s) => s.id === slotId);
  return eq ? eq.accept.includes(kindOf(item.type)) : true;
}

// Mueve/intercambia una instancia entre dos slots (devuelve nuevo obj de slots).
export function moveItem(slots, targetId, sourceId, level) {
  if (!sourceId || sourceId === targetId) return slots;
  if (sourceId === CRAFT_OUT) return slots; // el resultado no se arrastra
  const srcItem = slots[sourceId]; // instancia o null
  const tgtItem = slots[targetId];

  // Dont have enough level
  const isEquipSlot = EQUIP_SLOTS.find((s) => s.id === targetId);
  if (level < srcItem?.base?.requiredLevel && isEquipSlot) return slots;

  if (!canPlace(srcItem, targetId, level)) return slots; // destino no admite el item
  if (!canPlace(tgtItem, sourceId, level)) return slots; // el swap dejaría algo inválido
  return { ...slots, [targetId]: slots[sourceId], [sourceId]: slots[targetId] };
}

// Doble click: equipa (mochila -> equipo) o desequipa (equipo -> mochila).
export function autoMove(slots, fromId) {
  const item = slots[fromId]; // instancia o null
  if (!item) return slots;
  const kind = kindOf(item.type);
  if (EQUIP_IDS.has(fromId)) {
    const bp = Object.keys(slots).find((k) => k.startsWith("bp") && !slots[k]);
    if (!bp) return slots;
    return { ...slots, [bp]: slots[fromId], [fromId]: null };
  }
  const empty = EQUIP_SLOTS.find(
    (s) => s.accept.includes(kind) && !slots[s.id],
  );
  if (empty) return { ...slots, [empty.id]: slots[fromId], [fromId]: null };
  const swap = EQUIP_SLOTS.find((s) => s.accept.includes(kind));
  if (swap)
    return { ...slots, [swap.id]: slots[fromId], [fromId]: slots[swap.id] };
  return slots;
}
