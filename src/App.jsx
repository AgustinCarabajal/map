import { useState, useEffect, useRef, useCallback } from "react";
import Game from "./Game.jsx";
import Inventory from "./Inventory.jsx";
import Character from "./Character.jsx";
import CraftingModal from "./CraftingModal.jsx";
import DeathModal from "./DeathModal.jsx";
import ItemSpawner from "./ItemSpawner.jsx";
import {
  buildInitialSlots,
  moveItem,
  autoMove,
  CRAFT_SLOTS,
  EQUIP_SLOTS,
} from "./inventoryData.js";
import { matchRecipe } from "./recipes.js";
import { makeItem } from "./items.js";
import { computeStats, mainDamageStat, activeSkill } from "./modifiers.js";
import { playerStats } from "./stats.js";
import { getLevelFromXP } from "./level.js";
import LevelAnimation from "./LevelAnimation.jsx";
import { Experience, ResourceBar } from "./UI.jsx";

export default function App() {
  const gameRef = useRef(null);

  const [invOpen, setInvOpen] = useState(false);
  const [charOpen, setCharOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [character, setCharacter] = useState("soldier");
  const [hp, setHp] = useState(1);
  const [maxHp, setMaxHp] = useState(1);
  const [mp, setMp] = useState(0);
  const [maxMp, setMaxMp] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(getLevelFromXP(xp));
  const [name, setName] = useState("drach3");
  const [levelAnimation, setLevelAnimation] = useState(false);
  // Menú de pruebas (abajo) + toggles de opciones de test.
  const [menuOpen, setMenuOpen] = useState(false);
  const [reducedVision, setReducedVision] = useState(false);
  // Tipo de mapa: 'original' (tiles.png) o 'stone'/'gold' (tileset map_00).
  const [mapTheme, setMapTheme] = useState("original");
  // Estado de slots compartido entre el inventario y la mesa de crafteo.
  const [slots, setSlots] = useState(buildInitialSlots);
  // Espejo de slots que lee el pickup (Phaser) para chequear espacio al vuelo.
  const slotsRef = useRef(slots);
  // Oro del jugador (se recoge de cofres y al matar mobs).
  const [gold, setGold] = useState(0);
  // Stats efectivas (base + equipo) para el panel de personaje (C).
  const [stats, setStats] = useState(playerStats);

  // Arma de la main hand (la lee Phaser para el ataque) y el equipo por slot.
  const weaponRef = useRef(null);
  const equipRef = useRef({});
  const characterRef = useRef("witch");

  // Modo de visión reducida (niebla). Lo lee Phaser en su loop de update.
  const reducedVisionRef = useRef(false);
  // Tipo de mapa que lee Phaser; al cambiarlo regenera el mapa con ese tema.
  const mapThemeRef = useRef("original");
  // Combate que lee Phaser: stats efectivas (base + equipo) y qué stat de daño
  // usar para atacar (según el tag del arma/skill de main hand).
  const combatRef = useRef({
    stats: playerStats,
    damageType: "physicalDamage",
  });
  // Puente App -> Phaser para tirar un item al suelo (lo setea Game al crear la escena).
  const worldDropRef = useRef(null);
  // Item "agarrado" en el cursor: { item, source } o null. Se levanta con click
  // en un slot y se suelta con otro click (en un slot o en el suelo).
  const [grab, setGrab] = useState(null);
  // Imagen que sigue al mouse mientras hay un item agarrado.
  const grabImgRef = useRef(null);

  const selectCharacter = useCallback((key) => {
    setCharacter(key);
    characterRef.current = key;
  }, []);

  // Toggle del modo de visión reducida (niebla de guerra).
  const toggleReducedVision = useCallback(() => {
    setReducedVision((v) => {
      const next = !v;
      reducedVisionRef.current = next;
      return next;
    });
  }, []);

  // Elegir tipo de mapa: actualiza el ref (Phaser regenera al detectar el cambio).
  const selectMapTheme = useCallback((key) => {
    setMapTheme(key);
    mapThemeRef.current = key;
  }, []);

  const closeInv = useCallback(() => setInvOpen(false), []);
  const closeChar = useCallback(() => setCharOpen(false), []);
  const closeStore = useCallback(() => setStoreOpen(false), []);
  const openStore = useCallback(() => setStoreOpen(true), []);

  // Mantener el espejo de slots en sync (para que el pickup vea el estado actual).
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  // Recoger un item del suelo -> primer slot de mochila libre. Devuelve si entró
  // (false = mochila llena; el item se queda en el piso).
  const pickupItem = useCallback((item) => {
    const cur = slotsRef.current;
    const free = Object.keys(cur).find((k) => k.startsWith("bp") && !cur[k]);
    if (!free) return false;
    slotsRef.current = { ...cur, [free]: item };
    setSlots((prev) => {
      const b = Object.keys(prev).find((k) => k.startsWith("bp") && !prev[k]);
      return b ? { ...prev, [b]: item } : prev;
    });
    return true;
  }, []);

  // Sumar oro (cofres / kills de mobs).
  const addGold = useCallback(
    (amount) => setGold((g) => g + (amount || 0)),
    [],
  );

  const handleMove = useCallback(
    (target, source) => {
      setSlots((prev) => moveItem(prev, target, source, level));
    },
    [level],
  );
  const handleAutoMove = useCallback((from) => {
    setSlots((prev) => autoMove(prev, from));
  }, []);

  // Click en un slot: si no hay nada agarrado, levanta ese item (queda en el
  // cursor); si ya hay algo agarrado, lo suelta en ese slot (o cancela si es el
  // mismo). El item queda "en el aire" pero permanece en su slot origen hasta
  // que se concreta el destino (así el swap/validación usa moveItem).
  const onSlotClick = useCallback(
    (slotId) => {
      if (!grab) {
        if (slots[slotId]) setGrab({ item: slots[slotId], source: slotId });
        return;
      }
      if (slotId !== grab.source) handleMove(slotId, grab.source);
      setGrab(null);
    },
    [grab, slots, handleMove],
  );

  // Soltar el item agarrado en el SUELO: lo spawnea en el mundo (Phaser) y lo
  // saca de su slot origen.
  const dropToGround = useCallback(() => {
    if (!grab) return;
    worldDropRef.current?.(grab.item);
    setSlots((prev) => ({ ...prev, [grab.source]: null }));
    setGrab(null);
  }, [grab]);

  // Resultado posible según la grilla (NO se muestra hasta combinar). matchRecipe
  // trabaja con ids -> mapeamos las instancias a su id.
  const craftResult = matchRecipe(CRAFT_SLOTS.map((id) => slots[id]?.id));

  // Botón "Combinar": genera el item y consume los ingredientes.
  const handleCombine = useCallback(() => {
    setSlots((prev) => {
      const result = matchRecipe(CRAFT_SLOTS.map((id) => prev[id]?.id));
      if (!result) return prev;
      const bp = Object.keys(prev).find((k) => k.startsWith("bp") && !prev[k]);
      if (!bp) return prev; // sin espacio en la mochila
      const next = { ...prev, [bp]: makeItem(result) };
      CRAFT_SLOTS.forEach((id) => (next[id] = null)); // se pierden los ingredientes
      return next;
    });
  }, []);

  // Avisar al juego qué quedó equipado (overlays por id) y recalcular el combate:
  // stats efectivas (base + mods del equipo) y qué stat de daño usar (tag del
  // item de main hand). Se aplica automáticamente al cambiar cualquier equipo.
  useEffect(() => {
    weaponRef.current = slots.weapon1?.id || null;
    equipRef.current = {
      weapon1: slots.weapon1?.id,
      weapon2: slots.weapon2?.id,
    };
    const equipped = EQUIP_SLOTS.map((s) => slots[s.id]).filter(Boolean);
    const eff = computeStats(playerStats, equipped);
    // Daño principal (skill de proyectil equipada > arma) y, si hay skill de
    // proyectil, su visual para que Phaser dispare esas bolas al atacar.

    combatRef.current = {
      stats: eff,
      damageType: mainDamageStat(slots),
      projectile: activeSkill(slots)?.projectile || null,
      skill: slots.skill1,
    };
    setStats(eff); // para que el panel de personaje muestre las stats con equipo
  }, [slots]);

  // Atajos: I = inventario, C = personaje, Escape = cerrar todo / cancelar grab.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setInvOpen((v) => !v);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setCharOpen((v) => !v);
      } else if (e.key === "Escape") {
        setGrab(null); // suelta el item agarrado (vuelve a su slot)
        setInvOpen(false);
        setCharOpen(false);
        setStoreOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mientras hay un item agarrado, la imagen sigue al cursor (via ref, sin
  // re-render por cada movimiento del mouse).
  useEffect(() => {
    if (!grab) return;
    const onMove = (e) => {
      const el = grabImgRef.current;
      if (el) {
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [grab]);

  useEffect(() => {
    setLevel((prev) => {
      const newLevel = getLevelFromXP(xp);
      if (newLevel > prev) setLevelAnimation(true);
      return newLevel;
    });
  }, [xp]);

  return (
    <div className="app-shell">
      {levelAnimation && (
        <LevelAnimation
          level={level}
          levelAnimation={levelAnimation}
          setLevelAnimation={setLevelAnimation}
        />
      )}
      {hp <= 0 && <DeathModal onClose={closeStore} gameRef={gameRef} />}
      {/* Character panel (left). Always mounted, hides itself. */}
      <Character
        open={charOpen}
        onClose={closeChar}
        stats={stats}
        damageType={mainDamageStat(slots)}
        characterRef={characterRef}
        xp={xp}
        level={level}
        name={name}
      />
      <main className="game-panel">
        <Game
          weaponRef={weaponRef}
          characterRef={characterRef}
          equipRef={equipRef}
          hp={hp}
          mp={mp}
          xp={xp}
          setHp={setHp}
          setMp={setMp}
          setXp={setXp}
          setMaxHp={setMaxHp}
          setMaxMp={setMaxMp}
          reducedVisionRef={reducedVisionRef}
          mapThemeRef={mapThemeRef}
          combatRef={combatRef}
          worldDropRef={worldDropRef}
          onOpenStore={openStore}
          onPickupItem={pickupItem}
          onAddGold={addGold}
          gameRef={gameRef}
        />
      </main>

      {/* Con un item agarrado: capa que atrapa clicks fuera de los paneles ->
          soltar en el suelo. Los paneles (z mayor) reciben el click primero. */}
      {grab && <div className="grab-catcher" onClick={dropToGround} />}
      {grab && (
        <img
          ref={grabImgRef}
          className="grab-cursor"
          src={`/items/${grab.item.id}.png`}
          alt={grab.item.name}
        />
      )}

      {/* Menú de pruebas (abajo): agrupa la selección de personaje y los
          toggles de opciones de test. Extensible: agregá más secciones/toggles. */}
      <div className="test-menu">
        <button
          className="test-menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
        >
          ⚙ Menu
        </button>
        {menuOpen && (
          <div className="test-menu-panel">
            <div className="menu-section">
              <span className="menu-section-title">Personaje</span>
              <div className="menu-row">
                {["witch", "warrior", "human"].map((key) => (
                  <button
                    key={key}
                    className={`char-btn${character === key ? " active" : ""}`}
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
                  ["original", "Original"],
                  ["stone", "Piedra"],
                  ["gold", "Oro"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={`char-btn${mapTheme === key ? " active" : ""}`}
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
                  className={`toggle-switch${reducedVision ? " on" : ""}`}
                  onClick={toggleReducedVision}
                >
                  <span className="toggle-knob" />
                </button>
              </label>
            </div>

            {/* Catálogo de items: spawnea cualquier item en la mochila para
                probarlo (mismas instancias que dropea un cofre). */}
            <ItemSpawner onSpawn={pickupItem} />
          </div>
        )}
      </div>
      {/* RESOURCES */}
      <div className="resources-bottom">
        <ResourceBar value={hp} maxValue={maxHp} type="hp" />
        <Experience xp={xp} level={level} />
        <ResourceBar value={mp} maxValue={maxMp} type="mp" />
      </div>

      {/* Inventario (derecha) y mesa de crafteo (flotante) comparten slots,
          así se pueden arrastrar items entre ambos. */}
      <Inventory
        open={invOpen}
        onClose={closeInv}
        slots={slots}
        onMove={handleMove}
        onSlotClick={onSlotClick}
        grabbedSource={grab?.source}
        grabbedItem={grab?.item}
        gold={gold}
      />
      <CraftingModal
        open={storeOpen}
        onClose={closeStore}
        slots={slots}
        onMove={handleMove}
        onSlotClick={onSlotClick}
        grabbedSource={grab?.source}
        grabbedItem={grab?.item}
        canCraft={!!craftResult}
        onCombine={handleCombine}
      />
    </div>
  );
}
