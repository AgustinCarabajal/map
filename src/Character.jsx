import { playerInfo, playerStats } from './stats.js'

// camelCase -> "Camel Case" (con HP/MP/EXP en mayúscula).
function prettyKey(k) {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\b(Hp|Mp)\b/g, (m) => m.toUpperCase())
}

// Categoría del daño que usa el player, según el stat de daño en uso (derivado
// del tag del arma/skill de main hand): físico, sagrado, demoníaco o elemental
// (fire/cold/lightning agrupados).
const DAMAGE_CATEGORY = {
  physicalDamage: 'Physical',
  sacredDamage: 'Sacred',
  demonicDamage: 'Demonic',
  fireDamage: 'Elemental (Fire)',
  coldDamage: 'Elemental (Cold)',
  lightningDamage: 'Elemental (Lightning)',
}

export default function Character({ open, onClose, stats = playerStats, damageType = 'physicalDamage' }) {
  if (!open) return null

  const expPct = Math.min(100, Math.round((playerInfo.exp / playerInfo.expToNext) * 100))
  const damageLabel = DAMAGE_CATEGORY[damageType] || 'Physical'

  return (
    <aside className="character">
      <header className="panel-header">
        <h2>Character</h2>
        <button className="panel-close" onClick={onClose} title="Close (C)">
          ✕
        </button>
      </header>

      <div className="char-id">
        <div className="char-name">{playerInfo.name}</div>
        <div className="char-class">{playerInfo.class}</div>
        <div className="char-level">Level {playerInfo.level}</div>
      </div>

      <div className="char-exp">
        <div className="exp-bar">
          <div className="exp-fill" style={{ width: `${expPct}%` }} />
        </div>
        <div className="exp-text">
          {playerInfo.exp} / {playerInfo.expToNext} EXP
        </div>
      </div>

      <div className="char-damage-type">
        <span className="stat-label">Damage Type</span>
        <span className="stat-value">{damageLabel}</span>
      </div>

      <h3>Stats</h3>
      <ul className="stat-list">
        {Object.entries(stats).map(([k, v]) => (
          <li key={k}>
            <span className="stat-label">{prettyKey(k)}</span>
            <span className="stat-value">{v}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
