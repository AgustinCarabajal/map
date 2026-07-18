import { useState, useEffect, useRef, useCallback } from 'react'
import Game from './Game.jsx'
import Inventory from './Inventory.jsx'
import Character from './Character.jsx'
import CraftingModal from './CraftingModal.jsx'
import { buildInitialSlots, moveItem, autoMove, CRAFT_SLOTS, EQUIP_SLOTS } from './inventoryData.js'
import { matchRecipe } from './recipes.js'
import { makeItem, computeStats, attackDamageStat } from './modifiers.js'
import { playerStats } from './stats.js'

export default function App() {
  const [invOpen, setInvOpen] = useState(false)
  const [charOpen, setCharOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const [character, setCharacter] = useState('soldier')
  // Menú de pruebas (abajo) + toggles de opciones de test.
  const [menuOpen, setMenuOpen] = useState(false)
  const [reducedVision, setReducedVision] = useState(false)
  // Tipo de mapa: 'original' (tiles.png) o 'stone'/'gold' (tileset map_00).
  const [mapTheme, setMapTheme] = useState('original')
  // Estado de slots compartido entre el inventario y la mesa de crafteo.
  const [slots, setSlots] = useState(buildInitialSlots)
  // Espejo de slots que lee el pickup (Phaser) para chequear espacio al vuelo.
  const slotsRef = useRef(slots)
  // Oro del jugador (se recoge de cofres y al matar mobs).
  const [gold, setGold] = useState(0)
  // Stats efectivas (base + equipo) para el panel de personaje (C).
  const [stats, setStats] = useState(playerStats)

  // Arma de la main hand (la lee Phaser para el ataque) y el equipo por slot.
  const weaponRef = useRef(null)
  const equipRef = useRef({})
  const characterRef = useRef('witch')
  // Modo de visión reducida (niebla). Lo lee Phaser en su loop de update.
  const reducedVisionRef = useRef(false)
  // Tipo de mapa que lee Phaser; al cambiarlo regenera el mapa con ese tema.
  const mapThemeRef = useRef('original')
  // Combate que lee Phaser: stats efectivas (base + equipo) y qué stat de daño
  // usar para atacar (según el tag del arma/skill de main hand).
  const combatRef = useRef({ stats: playerStats, damageType: 'physicalDamage' })

  const selectCharacter = useCallback((key) => {
    setCharacter(key)
    characterRef.current = key
  }, [])

  // Toggle del modo de visión reducida (niebla de guerra).
  const toggleReducedVision = useCallback(() => {
    setReducedVision((v) => {
      const next = !v
      reducedVisionRef.current = next
      return next
    })
  }, [])

  // Elegir tipo de mapa: actualiza el ref (Phaser regenera al detectar el cambio).
  const selectMapTheme = useCallback((key) => {
    setMapTheme(key)
    mapThemeRef.current = key
  }, [])

  const closeInv = useCallback(() => setInvOpen(false), [])
  const closeChar = useCallback(() => setCharOpen(false), [])
  const closeStore = useCallback(() => setStoreOpen(false), [])
  const openStore = useCallback(() => setStoreOpen(true), [])

  // Mantener el espejo de slots en sync (para que el pickup vea el estado actual).
  useEffect(() => {
    slotsRef.current = slots
  }, [slots])

  // Recoger un item del suelo -> primer slot de mochila libre. Devuelve si entró
  // (false = mochila llena; el item se queda en el piso).
  const pickupItem = useCallback((item) => {
    const cur = slotsRef.current
    const free = Object.keys(cur).find((k) => k.startsWith('bp') && !cur[k])
    if (!free) return false
    slotsRef.current = { ...cur, [free]: item }
    setSlots((prev) => {
      const b = Object.keys(prev).find((k) => k.startsWith('bp') && !prev[k])
      return b ? { ...prev, [b]: item } : prev
    })
    return true
  }, [])

  // Sumar oro (cofres / kills de mobs).
  const addGold = useCallback((amount) => setGold((g) => g + (amount || 0)), [])

  const handleMove = useCallback((target, source) => {
    setSlots((prev) => moveItem(prev, target, source))
  }, [])
  const handleAutoMove = useCallback((from) => {
    setSlots((prev) => autoMove(prev, from))
  }, [])

  // Resultado posible según la grilla (NO se muestra hasta combinar). matchRecipe
  // trabaja con ids -> mapeamos las instancias a su id.
  const craftResult = matchRecipe(CRAFT_SLOTS.map((id) => slots[id]?.id))

  // Botón "Combinar": genera el item y consume los ingredientes.
  const handleCombine = useCallback(() => {
    setSlots((prev) => {
      const result = matchRecipe(CRAFT_SLOTS.map((id) => prev[id]?.id))
      if (!result) return prev
      const bp = Object.keys(prev).find((k) => k.startsWith('bp') && !prev[k])
      if (!bp) return prev // sin espacio en la mochila
      const next = { ...prev, [bp]: makeItem(result) }
      CRAFT_SLOTS.forEach((id) => (next[id] = null)) // se pierden los ingredientes
      return next
    })
  }, [])

  // Avisar al juego qué quedó equipado (overlays por id) y recalcular el combate:
  // stats efectivas (base + mods del equipo) y qué stat de daño usar (tag del
  // item de main hand). Se aplica automáticamente al cambiar cualquier equipo.
  useEffect(() => {
    weaponRef.current = slots.weapon1?.id || null
    equipRef.current = { weapon1: slots.weapon1?.id, weapon2: slots.weapon2?.id }
    const equipped = EQUIP_SLOTS.map((s) => slots[s.id]).filter(Boolean)
    const eff = computeStats(playerStats, equipped)
    combatRef.current = { stats: eff, damageType: attackDamageStat(slots.weapon1) }
    setStats(eff) // para que el panel de personaje muestre las stats con equipo
  }, [slots])

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
      <Character open={charOpen} onClose={closeChar} stats={stats} />
      <main className="game-panel">
        <Game
          weaponRef={weaponRef}
          characterRef={characterRef}
          equipRef={equipRef}
          reducedVisionRef={reducedVisionRef}
          mapThemeRef={mapThemeRef}
          combatRef={combatRef}
          onOpenStore={openStore}
          onPickupItem={pickupItem}
          onAddGold={addGold}
        />
      </main>

      {/* Menú de pruebas (abajo): agrupa la selección de personaje y los
          toggles de opciones de test. Extensible: agregá más secciones/toggles. */}
      <div className="test-menu">
        {menuOpen && (
          <div className="test-menu-panel">
            <div className="menu-section">
              <span className="menu-section-title">Personaje</span>
              <div className="menu-row">
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
            </div>

            <div className="menu-section">
              <span className="menu-section-title">Mapa</span>
              <div className="menu-row">
                {[
                  ['original', 'Original'],
                  ['stone', 'Piedra'],
                  ['gold', 'Oro'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={`char-btn${mapTheme === key ? ' active' : ''}`}
                    onClick={() => selectMapTheme(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="menu-section">
              <span className="menu-section-title">Opciones de prueba</span>
              <label className="toggle-row">
                <span>Visión reducida</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reducedVision}
                  className={`toggle-switch${reducedVision ? ' on' : ''}`}
                  onClick={toggleReducedVision}
                >
                  <span className="toggle-knob" />
                </button>
              </label>
            </div>
          </div>
        )}

        <button
          className="test-menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
        >
          ⚙ Menú
        </button>
      </div>

      {/* Inventario (derecha) y mesa de crafteo (flotante) comparten slots,
          así se pueden arrastrar items entre ambos. */}
      <Inventory
        open={invOpen}
        onClose={closeInv}
        slots={slots}
        onMove={handleMove}
        onAutoMove={handleAutoMove}
        gold={gold}
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
