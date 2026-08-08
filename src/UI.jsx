import { LEVEL_XP } from "./level";

export function ResourceBar({
  value,
  maxValue,
  type,
  shield = 0,
  maxShield = 0,
}) {
  const percentage =
    maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0;
  const shieldPercentage =
    maxShield > 0 ? Math.max(0, Math.min(100, (shield / maxShield) * 100)) : 0;

  const gradients = {
    hp: "linear-gradient(to bottom, #b91c1c 0%, #991b1b 45%, #6f1515 100%)",
    mp: "linear-gradient(to bottom, #2563eb 0%, #1d4ed8 45%, #1e3a8a 100%)",
    sacred: "linear-gradient(to bottom, #ffe818 0%, #a79c1e 45%, #6f4c15 100%)",
    demonic:
      "linear-gradient(to bottom, #cd1bc1 0%, #851c80 45%, #61155a 100%)",
  };

  return (
    <div className="resource-bar">
      <div
        className="resource-bar__fill"
        style={{
          width: `${percentage}%`,
          background: gradients[type],
        }}
      />

      <div className="resource-bar__value">
        {Math.floor(value)} / {Math.floor(maxValue)}
      </div>
      {/* SHIELD */}
      <div className="resource-bar-2">
        <div
          className="resource-bar__fill-2"
          style={{
            width: `${shieldPercentage}%`,
            background: gradients[type === "mp" ? "demonic" : "sacred"],
          }}
        />

        <div className="resource-bar__value-2">
          {Math.floor(shield)} / {Math.floor(maxShield)}
        </div>
      </div>
    </div>
  );
}

export const Experience = ({ xp, level }) => {
  const expPct = Math.min(
    100,
    Math.max(0, Math.round((xp / LEVEL_XP[level + 1]) * 100)),
  );

  return (
    <div className="experience">
      <div className="experience__fill" style={{ width: `${expPct}%` }} />

      <div className="experience__text">
        {Math.floor(xp)} / {Math.floor(LEVEL_XP[level + 1])} xp
      </div>
    </div>
  );
};
