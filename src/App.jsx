import { useState, useEffect, useRef, useCallback } from 'react'
import Game from './Game.jsx'
import Inventory from './Inventory.jsx'
import Character from './Character.jsx'

export default function App() {
  const [invOpen, setInvOpen] = useState(false)
  const [charOpen, setCharOpen] = useState(false)
  const [character, setCharacter] = useState('soldier')
  // Arma equipada en la main hand (la lee Phaser en cada ataque).
  const weaponRef = useRef(null)
  // Personaje seleccionado (lo lee Phaser para cambiar en caliente).
  const characterRef = useRef('witch')

  const selectCharacter = useCallback((key) => {
    setCharacter(key)
    characterRef.current = key
  }, [])

  const closeInv = useCallback(() => setInvOpen(false), [])
  const closeChar = useCallback(() => setCharOpen(false), [])
  const handleEquipChange = useCallback((mainHandItemId) => {
    weaponRef.current = mainHandItemId
  }, [])

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
        <Game weaponRef={weaponRef} characterRef={characterRef} />
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

      {/* Inventory (right). Always mounted so equipment isn't lost. */}
      <Inventory open={invOpen} onClose={closeInv} onEquipChange={handleEquipChange} />
    </div>
  )
}
