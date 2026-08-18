import { useState } from "react";
import { LEVEL_XP } from "./level.js";
import { playerStats } from "./stats.js";

// camelCase -> "Camel Case" (con HP/MP/EXP en mayúscula).
function prettyKey(k) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\b(Hp|Mp)\b/g, (m) => m.toUpperCase());
}

// Categoría del daño que usa el player, según el stat de daño en uso (derivado
// del tag del arma/skill de main hand): físico, sagrado, demoníaco o elemental
// (fire/cold/lightning agrupados).
const DAMAGE_CATEGORY = {
  physicalDamage: "Physical",
  sacredDamage: "Sacred",
  demonicDamage: "Demonic",
  fireDamage: "Elemental (Fire)",
  coldDamage: "Elemental (Cold)",
  lightningDamage: "Elemental (Lightning)",
};

export default function Character({
  open,
  onClose,
  stats = playerStats,
  damageType = "physicalDamage",
  characterRef,
  xp,
  level,
  name,
}) {
  if (!open) return null;

  const expPct = Math.min(100, Math.round((xp / LEVEL_XP[level + 1]) * 100));
  const damageLabel = DAMAGE_CATEGORY[damageType] || "Physical";

  // const icons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const lifeIcons = [1, 2, 3];
  const shieldIcons = [4, 5];
  const resIcons = [6, 7, 8];
  const speedIcons = [9];
  const physIcons = [13];
  const critIcons = [11, 12, 10];
  const dmgIcons = [14, 15];

  const [activeTab, setActiveTab] = useState("attack");

  return (
    <aside className="character">
      <header className="panel-header">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div class="avatar-container">
            <img class="avatar" src="/avatar/avatar.png" alt="Avatar" />
            <span
              class="avatar-badge"
              data-tooltip={`${xp} / ${LEVEL_XP[level + 1]} XP`}
            >
              {level}
            </span>
          </div>
          <div>
            <div className="char-name">{name}</div>
            <div className="char-class">{characterRef.current}</div>
          </div>
        </div>
        <button className="panel-close" onClick={onClose} title="Close (C)">
          ✕
        </button>
      </header>

      <div className="char-damage-type">
        <span className="stat-label">Damage Type</span>
        <span className="stat-value">{damageLabel}</span>
      </div>

      <div className="stats-container">
        {/* Botones de Navegación de Tabs */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "attack" ? "active" : ""}`}
            onClick={() => setActiveTab("attack")}
          >
            Ataque
          </button>
          <button
            className={`tab-btn ${activeTab === "defense" ? "active" : ""}`}
            onClick={() => setActiveTab("defense")}
          >
            Defensa
          </button>
        </div>

        <div
          className="tabs-content"
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {/* ================= PESTAÑA DE DEFENSA ================= */}
          {activeTab === "defense" && (
            <>
              <div className="stat-icons-row">
                {lifeIcons.map((idx) => {
                  return (
                    <div key={idx} className="stat-card">
                      <img
                        src={`/icons/icono_${idx}.png`}
                        className="stat-icon"
                        alt=""
                      />

                      {/* Valor principal visible sobre el icono */}
                      <strong className="stat-value stat-text">
                        {idx === 1
                          ? stats.hp
                          : idx === 2
                            ? stats.defense
                            : stats.mp}
                      </strong>

                      {/* Tooltip flotante en hover */}
                      <div className="stat-tooltip">
                        <strong className="stat-value stat-text-second">
                          {idx === 1
                            ? "Regen +" + stats.hpRegen
                            : idx === 2
                              ? "Block " + stats.blockChance + "%"
                              : "Regen +" + stats.mpRegen}
                        </strong>
                        <strong className="stat-value stat-text-second">
                          {idx === 1
                            ? "On Hit +" + stats.hpLeechOnHit
                            : idx === 2
                              ? "Evasion " + stats.chanceToEvade + "%"
                              : "On Hit +" + stats.mpLeechOnHit}
                        </strong>
                        {idx === 2 && (
                          <>
                            <strong className="stat-value stat-text-second">
                              {"Reflected " + stats.damageReflection + "%"}
                            </strong>
                            <strong className="stat-value stat-text-second">
                              {"Reduced " + stats.damageReduction + "%"}
                            </strong>
                          </>
                        )}
                        {idx === 1 && (
                          <>
                            <strong className="stat-value stat-text-second">
                              {"On Kill +" + stats.hpLeechOnKill}
                            </strong>
                            <strong className="stat-value stat-text-second">
                              {"On Dmg Taken +" + stats.hpLeechOnDamageTaken}
                            </strong>
                          </>
                        )}
                        {idx === 3 && (
                          <>
                            <strong className="stat-value stat-text-second">
                              {"On Kill +" + stats.mpLeechOnKill}
                            </strong>
                            <strong className="stat-value stat-text-second">
                              {"On Dmg Taken +" + stats.mpLeechOnDamageTaken}
                            </strong>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="stat-icons-row">
                {shieldIcons.map((idx) => {
                  return (
                    <div key={idx} className="stat-card">
                      <img
                        src={`/icons/icono_${idx}.png`}
                        className="stat-icon"
                      />
                      {/* Valor principal visible sobre el icono */}
                      <strong className="stat-value stat-text">
                        {idx === 4 ? stats.sacredShield : stats.demonicShield}
                      </strong>

                      {/* Tooltip flotante en hover */}
                      <div className="stat-tooltip">
                        {idx === 4 && (
                          <>
                            <strong className="stat-value stat-text-second">
                              {"Regen +" + stats.sacredRegen}
                            </strong>
                          </>
                        )}
                        {idx === 5 && (
                          <>
                            <strong className="stat-value stat-text-second">
                              {"Regen +" + stats.demonicRegen}
                            </strong>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="stat-icons-row">
                {resIcons.map((idx) => {
                  return (
                    <div key={idx} className="stat-card">
                      <img
                        src={`/icons/icono_${idx}.png`}
                        className="stat-icon"
                      />
                      <strong className="stat-value stat-text">
                        {idx === 6
                          ? stats.fireResist
                          : idx === 7
                            ? stats.coldResist
                            : stats.lightningResist}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <div className="stat-icons-row">
                {speedIcons.map((idx) => {
                  return (
                    <div key={idx} className="stat-card">
                      <img
                        src={`/icons/icono_${idx}.png`}
                        className="stat-icon"
                      />
                      <strong className="stat-value stat-text">
                        {idx === 9
                          ? stats.movementSpeed + "%"
                          : stats.attackSpeed + "%"}
                      </strong>
                      {idx === 10 && (
                        <div className="stat-tooltip">
                          <strong className="stat-value stat-text-second">
                            {"Atk Speed " + stats.attackSpeed + "%"}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"AoE Radius " + stats.areaRadius}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"AoE Damage " + stats.areaDamage}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"Dmg Over Time " + stats.damageOverTime}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"DoT Duration " + stats.damageOverTimeDuration}
                          </strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {activeTab === "attack" && (
            <>
              <div className="stat-icons-row">
                {physIcons.map((idx) => {
                  return (
                    <div key={idx} className="stat-card">
                      <img
                        src={`/icons/icono_${idx}.png`}
                        className="stat-icon"
                      />
                      <strong className="stat-value stat-text">
                        {stats.physicalDamage}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <div className="stat-icons-row">
                {dmgIcons.map((idx) => {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                      >
                        <strong
                          className="stat-value"
                          style={{ color: idx === 14 ? "red" : "yellow" }}
                        >
                          {idx === 14 ? stats.fireDamage : stats.sacredDamage}
                        </strong>
                        <img
                          src={`/icons/icono_${idx}.png`}
                          className="stat-icon"
                        />
                        <strong
                          className="stat-value"
                          style={{ color: idx === 14 ? "yellow" : "violet" }}
                        >
                          {idx === 14
                            ? stats.lightningDamage
                            : stats.demonicDamage}
                        </strong>
                      </div>
                      {idx === 14 && (
                        <strong
                          className="stat-value"
                          style={{ color: "cyan" }}
                        >
                          {stats.coldDamage}
                        </strong>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="stat-icons-row">
                {critIcons.map((idx) => {
                  return (
                    <div key={idx} className="stat-card">
                      <img
                        src={`/icons/icono_${idx}.png`}
                        className="stat-icon"
                      />
                      <strong className="stat-value stat-text">
                        {idx === 11
                          ? stats.critChance + "%"
                          : idx === 12
                            ? stats.projectileCount
                            : stats.attackSpeed + "%"}
                      </strong>
                      {idx === 11 && (
                        <div className="stat-tooltip">
                          <strong className="stat-value stat-text-second">
                            {"Chance " + stats.critChance + "%"}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"Multiplier " + stats.critDamage + "%"}
                          </strong>
                        </div>
                      )}
                      {idx === 12 && (
                        <div className="stat-tooltip">
                          <strong className="stat-value stat-text-second">
                            {"Pierce " + stats.pierceCount + " Projectiles"}
                          </strong>
                        </div>
                      )}
                      {idx === 10 && (
                        <div className="stat-tooltip">
                          <strong className="stat-value stat-text-second">
                            {"Atk Speed " + stats.attackSpeed + "%"}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"AoE Radius " + stats.areaRadius}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"AoE Damage " + stats.areaDamage}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"Dmg Over Time " + stats.damageOverTime}
                          </strong>
                          <strong className="stat-value stat-text-second">
                            {"DoT Duration " + stats.damageOverTimeDuration}
                          </strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {/* <ul className="stat-list">
        {Object.entries(stats).map(([k, v]) => (
          <li key={k}>
            <span className="stat-label">{prettyKey(k)}</span>
            <span className="stat-value">{v}</span>
          </li>
        ))}
      </ul> */}
    </aside>
  );
}
