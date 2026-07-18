import { useState } from 'react'
import { hydrate, CRAFT_SLOTS, CRAFT_OUT } from './inventoryData.js'
import ItemTooltip from './ItemTooltip.jsx'

function Slot({ slotId, item, big, overId, onDropItem, setOver, clearOver, onTake, onHover, onHoverEnd }) {
  const cls = [
    'slot',
    big ? 'craft-out' : 'bp',
    overId === slotId ? 'over' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(slotId)
      }}
      onDragLeave={() => clearOver(slotId)}
      onDrop={(e) => {
        e.preventDefault()
        clearOver(slotId)
        onDropItem(slotId, e.dataTransfer.getData('text/plain'))
      }}
    >
      {item && (
        <img
          className="inv-item"
          src={item.img}
          alt={item.name}
          title={item.name}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', slotId)
            e.dataTransfer.effectAllowed = 'move'
            onHoverEnd()
          }}
          onDoubleClick={onTake}
          onMouseEnter={(e) => onHover(item, e)}
          onMouseMove={(e) => onHover(item, e)}
          onMouseLeave={onHoverEnd}
        />
      )}
    </div>
  )
}

export default function CraftingModal({ open, onClose, slots, onMove, canCraft, onCombine }) {
  const [overId, setOverId] = useState(null)
  const [tip, setTip] = useState(null) // { item, x, y } para el tooltip
  const setOver = (id) => setOverId(id)
  const clearOver = (id) => setOverId((cur) => (cur === id ? null : cur))
  const showTip = (item, e) => setTip({ item, x: e.clientX, y: e.clientY })
  const hideTip = () => setTip(null)

  if (!open) return null

  const resolve = (id) => hydrate(slots[id])
  const slotProps = { overId, onDropItem: onMove, setOver, clearOver, onHover: showTip, onHoverEnd: hideTip }

  return (
    <div className="crafting-modal">
      <header className="panel-header">
        <h2>Crafting</h2>
        <button className="panel-close" onClick={onClose} title="Cerrar">
          ✕
        </button>
      </header>

      <div className="crafting-area">
        <div className="craft-grid">
          {CRAFT_SLOTS.map((id) => (
            <Slot key={id} slotId={id} item={resolve(id)} {...slotProps} />
          ))}
        </div>
        <div className="craft-arrow">→</div>
        {/* El resultado no se previsualiza: se genera al combinar. */}
        <Slot slotId={CRAFT_OUT} item={null} big {...slotProps} />
      </div>

      <button className="craft-btn" disabled={!canCraft} onClick={onCombine}>
        Combinar
      </button>

      <p className="inventory-hint">Arrastrá items desde el inventario (I)</p>

      {tip && <ItemTooltip item={tip.item} x={tip.x} y={tip.y} />}
    </div>
  )
}
