export default function DeathModal({ onClose, gameRef }) {
  const handleStartGame = () => {
    const scene = gameRef.current?.scene.getScene("MenuScene");

    scene?.scene.start("DungeonScene");
  };

  return (
    <div className="dead-overlay">
      <div className="dead-modal">
        {/* <header className="panel-header">
        <h2>title</h2>
        <button className="panel-close" onClick={onClose} title="Cerrar">
          ✕
        </button>
      </header> */}

        <h2 className="crafting-area">You are dead</h2>

        <button className="craft-btn" onClick={handleStartGame}>
          Resurrect at checkpoint
        </button>
      </div>
    </div>
  );
}
