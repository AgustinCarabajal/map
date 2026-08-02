import { useState, useCallback } from 'react'
import { hydrate, kindOf, EQUIP_SLOTS, BACKPACK_SIZE } from './inventoryData.js'
import ItemTooltip from './ItemTooltip.jsx'

function Slot({
  slotId,
  item,
  equip,
  overId,
  dragType,
  held,
  hovered,
  grabType,
  onDropItem,
  onDragStart,
  onSlotClick,
  onSlotEnter,
  onSlotLeave,
  onHover,
  onHoverEnd,
}) {
  // Tipo "activo" apuntando a este slot: al arrastrar (dragType) o al tener un
  // item agarrado y pasar el mouse por encima (grabType + hovered).
  const activeType = dragType || (hovered ? grabType : null)
  const isOver = overId === slotId || (grabType && hovered)
  const accepts = equip ? equip.accept.includes(activeType) : true
  const showInvalid = isOver && activeType && !accepts // item no permitido aquí
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
      onMouseEnter={() => onSlotEnter(slotId)}
      onMouseLeave={() => onSlotLeave(slotId)}
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
      {item ? item.version === 'neon' ? (
        <div className="neon-container">
          <img
            className="inv-item neon-icon"
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
        </div>
      ) :
      
      item.version === 'shiny' ? (
        <div className="shine-container">
          <div 
            className="sword-shine-wrapper"
            style={{ '--icon-url': `url(${item.img})` }}
          >
            <img className="sword-icon" 
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
            
            {/* Capa única de brillo diagonal */}
            <div className="shine-layer" />
          </div>
        </div>
      ) :
      (
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

export default function Inventory({ open, onClose, slots, onMove, onSlotClick, grabbedSource, grabbedItem, gold = 0 }) {
  const [overId, setOverId] = useState(null)
  const [dragType, setDragType] = useState(null)
  const [hoverId, setHoverId] = useState(null) // slot bajo el mouse (para el grab)
  const [tip, setTip] = useState(null) // { item, x, y } para el tooltip

  const showTip = useCallback((item, e) => setTip({ item, x: e.clientX, y: e.clientY }), [])
  const hideTip = useCallback(() => setTip(null), [])

  // Kind del item agarrado (para validar contra el `accept` de cada slot).
  const grabType = grabbedItem ? kindOf(grabbedItem.type) : null
  const onSlotEnter = useCallback((id) => setHoverId(id), [])
  const onSlotLeave = useCallback((id) => setHoverId((cur) => (cur === id ? null : cur)), [])

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
              held={grabbedSource === eq.id}
              hovered={hoverId === eq.id}
              grabType={grabType}
              onDropItem={handleDrop}
              onDragStart={dragHelpers}
              onSlotClick={onSlotClick}
              onSlotEnter={onSlotEnter}
              onSlotLeave={onSlotLeave}
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
                held={grabbedSource === id}
                hovered={hoverId === id}
                grabType={grabType}
                onDropItem={handleDrop}
                onDragStart={dragHelpers}
                onSlotClick={onSlotClick}
                onSlotEnter={onSlotEnter}
                onSlotLeave={onSlotLeave}
                onHover={showTip}
                onHoverEnd={hideTip}
              />
            )
          })}
        </div>
      </section>

      <p className="inventory-hint">
        Click an item to grab it · click a slot to place it, or click the ground to drop it · <b>I</b> closes
      </p>

      {tip && <ItemTooltip item={tip.item} x={tip.x} y={tip.y} />}
    </aside>
  )
}
