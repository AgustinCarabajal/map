import { useState, useEffect, useCallback } from 'react'
import { item_list } from './items.js'

export const ATTR_LABEL = { int: 'Intelligence', dex: 'Dexterity', str: 'Strength' }
export const ATTR_COLOR = { int: '#639bff', dex: '#51c96e', str: '#de3838' }

// "Tipo de equipo" de cada item, derivado de su `type`:
//   sword/bow -> arma (main hand) · shield -> off hand · book_* -> habilidad
function kindOf(type) {
  if (type.startsWith('book_')) return 'skill'
  if (type === 'shield') return 'shield'
  return 'weapon'
}

// Catálogo construido desde item_list (items.js), indexado por `type`.
const ITEMS = item_list.reduce((map, it) => {
  map[it.type] = {
    ...it,
    id: it.type,
    kind: kindOf(it.type),
    attr: it.type.startsWith('book_') ? it.type.slice(5) : null, // int/dex/str
  }
  return map
}, {})

// --- Slots de equipo (orden = grilla 3x3). `accept` = tipos que admite. ---
const EQUIP_SLOTS = [
  { id: 'amulet', type: 'amulet', accept: ['amulet'] },
  { id: 'wings', type: 'wings', accept: ['wings'] },
  { id: 'ring', type: 'ring', accept: ['ring'] },
  { id: 'weapon1', type: 'main hand', accept: ['weapon'] }, // espada / arco
  { id: 'helmet', type: 'helmet', accept: ['helmet'] },
  { id: 'weapon2', type: 'off hand', accept: ['shield'] }, // escudo
  { id: 'gloves', type: 'gloves', accept: ['gloves'] },
  { id: 'armor', type: 'armor', accept: ['armor'] },
  { id: 'boots', type: 'boots', accept: ['boots'] },
]

const BACKPACK_SIZE = 32
const EQUIP_IDS = new Set(EQUIP_SLOTS.map((s) => s.id))

function buildInitialSlots() {
  const slots = {}
  EQUIP_SLOTS.forEach((s) => (slots[s.id] = null))
  for (let i = 0; i < BACKPACK_SIZE; i++) slots[`bp${i}`] = null
  // Items iniciales en la mochila.
  slots.bp0 = 'sword'
  slots.bp1 = 'shield'
  slots.bp2 = 'bow'
  slots.bp3 = 'book_int'
  slots.bp4 = 'book_dex'
  slots.bp5 = 'book_str'
  return slots
}

// ¿Puede el item ir a ese slot? La mochila acepta todo; el equipo, por tipo.
function canPlace(item, slotId) {
  if (!item) return true
  const eq = EQUIP_SLOTS.find((s) => s.id === slotId)
  return eq ? eq.accept.includes(item.kind) : true
}

function Slot({
  slotId,
  item,
  equip,
  overId,
  dragType,
  onDropItem,
  onDragStart,
  onAutoMove,
  onHover,
  onHoverEnd,
}) {
  const isOver = overId === slotId
  const accepts = equip ? equip.accept.includes(dragType) : true
  const showInvalid = isOver && dragType && !accepts // item no permitido aquí
  const showOver = isOver && !showInvalid

  const cls = [
    'slot',
    equip ? `eq eq-${equip.type}` : 'bp',
    showOver ? 'over' : '',
    showInvalid ? 'invalid' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      onDragOver={(e) => {
        e.preventDefault()
        onDragStart.setOver(slotId)
      }}
      onDragLeave={() => onDragStart.clearOver(slotId)}
      onDrop={(e) => {
        e.preventDefault()
        onDropItem(slotId, e.dataTransfer.getData('text/plain'))
      }}
    >
      {item ? (
        <img
          className="inv-item"
          src={item.img}
          alt={item.name}
          title={item.name}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', slotId)
            e.dataTransfer.effectAllowed = 'move'
            onDragStart.setDrag(item.kind)
            onHoverEnd()
          }}
          onDragEnd={() => onDragStart.clearDrag()}
          onDoubleClick={() => onAutoMove(slotId)}
          onMouseEnter={(e) => onHover(item, e)}
          onMouseMove={(e) => onHover(item, e)}
          onMouseLeave={onHoverEnd}
        />
      ) : (
        equip && <span className="slot-label">{equip.type}</span>
      )}
    </div>
  )
}

export default function Inventory({ open, onClose, onEquipChange }) {
  const [slots, setSlots] = useState(buildInitialSlots)
  const [overId, setOverId] = useState(null)
  const [dragType, setDragType] = useState(null)
  const [tip, setTip] = useState(null) // { item, x, y } para el tooltip

  const showTip = useCallback((item, e) => setTip({ item, x: e.clientX, y: e.clientY }), [])
  const hideTip = useCallback(() => setTip(null), [])

  // Avisar al juego qué item quedó en la main hand (weapon1).
  useEffect(() => {
    onEquipChange?.(slots.weapon1)
  }, [slots.weapon1, onEquipChange])

  const dragHelpers = {
    setOver: (id) => setOverId(id),
    clearOver: (id) => setOverId((cur) => (cur === id ? null : cur)),
    setDrag: (type) => setDragType(type),
    clearDrag: () => {
      setDragType(null)
      setOverId(null)
    },
  }

  // Mover/intercambiar entre dos slots (drag & drop).
  const handleDrop = useCallback((targetId, sourceId) => {
    setOverId(null)
    setDragType(null)
    if (!sourceId || sourceId === targetId) return
    setSlots((prev) => {
      const srcItem = prev[sourceId] ? ITEMS[prev[sourceId]] : null
      const tgtItem = prev[targetId] ? ITEMS[prev[targetId]] : null
      if (!canPlace(srcItem, targetId)) return prev // el destino no admite el item
      if (!canPlace(tgtItem, sourceId)) return prev // el swap dejaría algo inválido
      return { ...prev, [targetId]: prev[sourceId], [sourceId]: prev[targetId] }
    })
  }, [])

  // Doble click: equipa (mochila -> equipo) o desequipa (equipo -> mochila).
  const handleAutoMove = useCallback((fromId) => {
    setSlots((prev) => {
      const item = prev[fromId] ? ITEMS[prev[fromId]] : null
      if (!item) return prev
      if (EQUIP_IDS.has(fromId)) {
        const bp = Object.keys(prev).find((k) => k.startsWith('bp') && !prev[k])
        if (!bp) return prev
        return { ...prev, [bp]: prev[fromId], [fromId]: null }
      }
      const empty = EQUIP_SLOTS.find((s) => s.accept.includes(item.kind) && !prev[s.id])
      if (empty) return { ...prev, [empty.id]: prev[fromId], [fromId]: null }
      const swap = EQUIP_SLOTS.find((s) => s.accept.includes(item.kind))
      if (swap) return { ...prev, [swap.id]: prev[fromId], [fromId]: prev[swap.id] }
      return prev
    })
  }, [])

  const resolve = (id) => (slots[id] ? ITEMS[slots[id]] : null)

  if (!open) return null // se mantiene montado (conserva el equipo), solo oculto

  return (
    <aside className="inventory">
      <header className="inventory-header">
        <h2>Inventory</h2>
        <button className="inventory-close" onClick={onClose} title="Close (I)">
          ✕
        </button>
      </header>

        <section className="equipment">
          <h3>Equipment</h3>
          <div className="slot-equipment">
            {EQUIP_SLOTS.map((eq) => (
              <Slot
                key={eq.id}
                slotId={eq.id}
                equip={eq}
                item={resolve(eq.id)}
                overId={overId}
                dragType={dragType}
                onDropItem={handleDrop}
                onDragStart={dragHelpers}
                onAutoMove={handleAutoMove}
                onHover={showTip}
                onHoverEnd={hideTip}
              />
            ))}
          </div>
        </section>

        <section className="backpack">
          <h3>Backpack</h3>
          <div className="slot-items">
            {Array.from({ length: BACKPACK_SIZE }, (_, i) => {
              const id = `bp${i}`
              return (
                <Slot
                  key={id}
                  slotId={id}
                  item={resolve(id)}
                  overId={overId}
                  dragType={dragType}
                  onDropItem={handleDrop}
                  onDragStart={dragHelpers}
                  onAutoMove={handleAutoMove}
                  onHover={showTip}
                  onHoverEnd={hideTip}
                />
              )
            })}
          </div>
        </section>

      <p className="inventory-hint">
        Drag items between slots · double-click to equip/unequip · <b>I</b> closes
      </p>

      {tip && <ItemTooltip item={tip.item} x={tip.x} y={tip.y} />}
    </aside>
  )
}

// camelCase -> "Camel Case"
function prettyKey(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

function ItemTooltip({ item, x, y }) {
  const base = item.base ? Object.entries(item.base) : []
  const mods = item.possibleMods || item.effects || []
  return (
    <div className="item-tooltip" style={{ left: x + 14, top: y + 14 }}>
      <div
        className="tt-name"
        style={item.attr ? { color: ATTR_COLOR[item.attr] } : undefined}
      >
        {item.name}
      </div>
      {item.description && <div className="tt-desc">{item.description}</div>}
      {base.length > 0 && (
        <ul className="tt-stats">
          {base.map(([k, v]) => (
            <li key={k}>
              {prettyKey(k)}: <b>{v}</b>
            </li>
          ))}
        </ul>
      )}
      {mods.length > 0 && (
        <ul className="tt-mods">
          {mods.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
