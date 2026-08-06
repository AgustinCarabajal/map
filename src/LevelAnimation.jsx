import { useEffect } from "react";

export default function LevelAnimation({
  level,
  levelAnimation,
  setLevelAnimation,
}) {
  useEffect(() => {
    if (levelAnimation) {
      const timer = setTimeout(() => setLevelAnimation(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [levelAnimation, level]);

  return (
    <div key={level} className="levelup-animation">
      Level Up!
    </div>
  );
}
