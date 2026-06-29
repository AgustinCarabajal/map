import { useState, useCallback } from 'react'
import { ITEMS, EQUIP_SLOTS, BACKPACK_SIZE } from './inventoryData.js'
import ItemTooltip from './ItemTooltip.jsx'

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

export default function Inventory({ open, onClose, slots, onMove, onAutoMove }) {
  const [overId, setOverId] = useState(null)
  const [dragType, setDragType] = useState(null)
  const [tip, setTip] = useState(null) // { item, x, y } para el tooltip

  const showTip = useCallback((item, e) => setTip({ item, x: e.clientX, y: e.clientY }), [])
  const hideTip = useCallback(() => setTip(null), [])

  const dragHelpers = {
    setOver: (id) => setOverId(id),
    clearOver: (id) => setOverId((cur) => (cur === id ? null : cur)),
    setDrag: (type) => setDragType(type),
    clearDrag: () => {
      setDragType(null)
      setOverId(null)
    },
  }

  const handleDrop = (targetId, sourceId) => {
    setOverId(null)
    setDragType(null)
    onMove(targetId, sourceId)
  }

  const resolve = (id) => (slots[id] ? ITEMS[slots[id]] : null)

  if (!open) return null

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
              onAutoMove={onAutoMove}
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
                onAutoMove={onAutoMove}
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
