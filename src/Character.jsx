import { playerInfo, playerStats } from './stats.js'

// camelCase -> "Camel Case" (con HP/MP/EXP en mayúscula).
function prettyKey(k) {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\b(Hp|Mp)\b/g, (m) => m.toUpperCase())
}

export default function Character({ open, onClose }) {
  if (!open) return null

  const expPct = Math.min(100, Math.round((playerInfo.exp / playerInfo.expToNext) * 100))

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

      <h3>Stats</h3>
      <ul className="stat-list">
        {Object.entries(playerStats).map(([k, v]) => (
          <li key={k}>
            <span className="stat-label">{prettyKey(k)}</span>
            <span className="stat-value">{v}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
