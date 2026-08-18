import { useMemo, useState } from 'react'
import { item_list, makeItem, rollItem } from './items.js'
import ItemTooltip from './ItemTooltip.jsx'

// Orden y etiqueta de las categorías del catálogo (por `type` del item).
const CATEGORIES = [
  ['sword', 'Espadas'],
  ['axe', 'Hachas'],
  ['mace', 'Mazas'],
  ['bow', 'Arcos'],
  ['crossbow', 'Ballestas'],
  ['quiver', 'Carcajes'],
  ['staff', 'Bastones'],
  ['scepter', 'Cetros'],
  ['wand', 'Varitas'],
  ['shield', 'Escudos'],
  ['armor', 'Armadura'],
  ['skill', 'Libros'],
  ['jewel', 'Materiales'],
]

const catOf = (type) => (type.startsWith('book_') ? 'skill' : type)

// Catálogo de pruebas: todos los items del juego agrupados por categoría. Un
// click spawnea una instancia en la mochila (rolleada como un drop de cofre, o
// base si se apaga el toggle de mods).
export default function ItemSpawner({ onSpawn }) {
  const [cat, setCat] = useState('sword')
  const [withMods, setWithMods] = useState(true)
  const [hover, setHover] = useState(null) // { item, x, y }

  // Instancias base sólo para el preview del tooltip (no se guardan).
  const byCat = useMemo(() => {
    const map = {}
    for (const tpl of item_list) {
      const key = catOf(tpl.type)
      ;(map[key] ||= []).push({ id: tpl.id, preview: makeItem(tpl.id) })
    }
    return map
  }, [])

  const cats = CATEGORIES.filter(([key]) => byCat[key]?.length)
  const items = byCat[cat] || []

  const spawn = (id) => {
    const inst = withMods ? rollItem(id, { minMods: 1, maxMods: 5 }) : makeItem(id)
    if (inst) onSpawn(inst)
  }

  return (
    <div className="menu-section">
      <span className="menu-section-title">Items ({item_list.length})</span>
      <div className="menu-row spawner-cats">
        {cats.map(([key, label]) => (
          <button
            key={key}
            className={`char-btn spawner-cat${cat === key ? ' active' : ''}`}
            onClick={() => setCat(key)}
          >
            {label} <span className="spawner-count">{byCat[key].length}</span>
          </button>
        ))}
      </div>

      <label className="toggle-row">
        <span>Mods al azar</span>
        <button
          type="button"
          role="switch"
          aria-checked={withMods}
          className={`toggle-switch${withMods ? ' on' : ''}`}
          onClick={() => setWithMods((v) => !v)}
        >
          <span className="toggle-knob" />
        </button>
      </label>

      <div className="spawner-grid">
        {items.map(({ id, preview }) => (
          <button
            key={id}
            className="spawner-item"
            onClick={() => spawn(id)}
            onMouseEnter={(e) =>
              setHover({ item: preview, x: e.clientX, y: e.clientY })
            }
            onMouseMove={(e) =>
              setHover({ item: preview, x: e.clientX, y: e.clientY })
            }
            onMouseLeave={() => setHover(null)}
          >
            <img src={`/items/${id}.png`} alt={preview?.name || id} />
          </button>
        ))}
      </div>
      <span className="spawner-hint">Click = a la mochila</span>

      {hover?.item && (
        <ItemTooltip item={hover.item} x={hover.x} y={hover.y} />
      )}
    </div>
  )
}
