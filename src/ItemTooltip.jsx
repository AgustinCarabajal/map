import { useState, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ATTR_COLOR } from './inventoryData.js'

// camelCase -> "Camel Case"
function prettyKey(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

export default function ItemTooltip({ item, x, y }) {
  const base = item.base ? Object.entries(item.base) : []
  const mods = item.possibleMods || item.effects || []

  // Posición que se mantiene dentro de la pantalla (se voltea cerca de bordes).
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: x + 14, top: y + 14 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const pad = 8
    let left = x + 14
    let top = y + 14
    if (left + width > window.innerWidth - pad) left = x - width - 14
    if (left < pad) left = pad
    if (top + height > window.innerHeight - pad) top = y - height - 14
    if (top < pad) top = pad
    setPos({ left, top })
  }, [x, y, item])

  // Portal a body para escapar del stacking context del modal y verse encima.
  return createPortal(
    <div ref={ref} className="item-tooltip" style={{ left: pos.left, top: pos.top }}>
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
    </div>,
    document.body
  )
}
