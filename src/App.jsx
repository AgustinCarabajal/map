import { useState, useEffect, useRef, useCallback } from 'react'
import Game from './Game.jsx'
import Inventory from './Inventory.jsx'
import Character from './Character.jsx'
import CraftingModal from './CraftingModal.jsx'
import { buildInitialSlots, moveItem, autoMove, CRAFT_SLOTS } from './inventoryData.js'
import { matchRecipe } from './recipes.js'

export default function App() {
  const [invOpen, setInvOpen] = useState(false)
  const [charOpen, setCharOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const [character, setCharacter] = useState('soldier')
  // Estado de slots compartido entre el inventario y la mesa de crafteo.
  const [slots, setSlots] = useState(buildInitialSlots)

  // Arma de la main hand (la lee Phaser para el ataque) y el equipo por slot.
  const weaponRef = useRef(null)
  const equipRef = useRef({})
  const characterRef = useRef('witch')

  const selectCharacter = useCallback((key) => {
    setCharacter(key)
    characterRef.current = key
  }, [])

  const closeInv = useCallback(() => setInvOpen(false), [])
  const closeChar = useCallback(() => setCharOpen(false), [])
  const closeStore = useCallback(() => setStoreOpen(false), [])
  const openStore = useCallback(() => setStoreOpen(true), [])

  const handleMove = useCallback((target, source) => {
    setSlots((prev) => moveItem(prev, target, source))
  }, [])
  const handleAutoMove = useCallback((from) => {
    setSlots((prev) => autoMove(prev, from))
  }, [])

  // Resultado posible según la grilla (NO se muestra hasta combinar).
  const craftResult = matchRecipe(CRAFT_SLOTS.map((id) => slots[id]))

  // Botón "Combinar": genera el item y consume los ingredientes.
  const handleCombine = useCallback(() => {
    setSlots((prev) => {
      const result = matchRecipe(CRAFT_SLOTS.map((id) => prev[id]))
      if (!result) return prev
      const bp = Object.keys(prev).find((k) => k.startsWith('bp') && !prev[k])
      if (!bp) return prev // sin espacio en la mochila
      const next = { ...prev, [bp]: result }
      CRAFT_SLOTS.forEach((id) => (next[id] = null)) // se pierden los ingredientes
      return next
    })
  }, [])

  // Avisar al juego qué quedó equipado en cada mano (overlays + ataque).
  useEffect(() => {
    weaponRef.current = slots.weapon1 || null
    equipRef.current = { weapon1: slots.weapon1, weapon2: slots.weapon2 }
  }, [slots.weapon1, slots.weapon2])

  // Atajos: I = inventario, C = personaje, Escape = cerrar todo.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setInvOpen((v) => !v)
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setCharOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setInvOpen(false)
        setCharOpen(false)
        setStoreOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-shell">
      {/* Character panel (left). Always mounted, hides itself. */}
      <Character open={charOpen} onClose={closeChar} />
      <main className="game-panel">
        <Game
          weaponRef={weaponRef}
          characterRef={characterRef}
          equipRef={equipRef}
          onOpenStore={openStore}
        />
      </main>

      {/* Selector de personaje (flotante). */}
      <div className="character-select">
        {['witch', 'warrior', 'human'].map((key) => (
          <button
            key={key}
            className={`char-btn${character === key ? ' active' : ''}`}
            onClick={() => selectCharacter(key)}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Inventario (derecha) y mesa de crafteo (flotante) comparten slots,
          así se pueden arrastrar items entre ambos. */}
      <Inventory
        open={invOpen}
        onClose={closeInv}
        slots={slots}
        onMove={handleMove}
        onAutoMove={handleAutoMove}
      />
      <CraftingModal
        open={storeOpen}
        onClose={closeStore}
        slots={slots}
        onMove={handleMove}
        canCraft={!!craftResult}
        onCombine={handleCombine}
      />
    </div>
  )
}
