import { useState, useCallback } from 'react'
import { hydrate, EQUIP_SLOTS, BACKPACK_SIZE } from './inventoryData.js'
import ItemTooltip from './ItemTooltip.jsx'

function Slot({
  slotId,
  item,
  equip,
  overId,
  dragType,
  held,
  onDropItem,
  onDragStart,
  onSlotClick,
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
    held ? 'held' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      onClick={() => onSlotClick(slotId)}
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

export default function Inventory({ open, onClose, slots, onMove, onAutoMove, gold = 0 }) {
  const [overId, setOverId] = useState(null)
  const [dragType, setDragType] = useState(null)
  const [heldId, setHeldId] = useState(null) // slot "levantado" con un click
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
    setHeldId(null)
    onMove(targetId, sourceId)
  }

  // Click: si no hay nada levantado, levanta el item del slot; si ya hay algo
  // levantado, lo suelta en el slot clickeado (o cancela si es el mismo).
  const handleSlotClick = useCallback(
    (slotId) => {
      setHeldId((cur) => {
        if (cur == null) return slots[slotId] ? slotId : null // levantar
        if (cur === slotId) return null // click de nuevo en el mismo -> soltar
        onMove(slotId, cur) // soltar en el destino
        return null
      })
    },
    [slots, onMove]
  )

  const resolve = (id) => hydrate(slots[id])

  if (!open) return null

  return (
    <aside className="inventory">
      <header className="inventory-header">
        <h2>Inventory</h2>
        <span className="inventory-gold" title="Gold">🪙 {gold}</span>
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
              held={heldId === eq.id}
              onDropItem={handleDrop}
              onDragStart={dragHelpers}
              onSlotClick={handleSlotClick}
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
                held={heldId === id}
                onDropItem={handleDrop}
                onDragStart={dragHelpers}
                onSlotClick={handleSlotClick}
                onHover={showTip}
                onHoverEnd={hideTip}
              />
            )
          })}
        </div>
      </section>

      <p className="inventory-hint">
        Click an item to pick it up, click a slot to drop it · drag also works · <b>I</b> closes
      </p>

      {tip && <ItemTooltip item={tip.item} x={tip.x} y={tip.y} />}
    </aside>
  )
}
