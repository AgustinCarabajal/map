export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#08090b");

    const centerX = width / 2;
    const centerY = height / 2;

    // =========================
    // ROSE
    // =========================

    const rose = this.add.graphics();

    rose.setPosition(centerX, centerY);
    rose.setAlpha(0);
    rose.setScale(0.15);

    // Outer petals
    rose.lineStyle(2, 0x806047, 0.35);

    const petals = 6;
    const outerRadius = 35;

    for (let i = 0; i < petals; i++) {
      const angle = (Math.PI * 2 * i) / petals;

      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;

      rose.strokeEllipse(x, y, 35, 75);
    }

    // Inner petals
    rose.lineStyle(1, 0xb08050, 0.55);

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;

      const x = Math.cos(angle) * 35;
      const y = Math.sin(angle) * 35;

      rose.strokeEllipse(x, y, 55, 85);
    }

    // Center
    rose.lineStyle(2, 0xd6c3a5, 0.7);
    rose.strokeCircle(0, 0, 12);

    rose.fillStyle(0x8b6f47, 0.3);
    rose.fillCircle(0, 0, 7);

    // =========================
    // TITLE
    // =========================

    const title = this.add
      .text(centerX, centerY - 8, "GARDEN", {
        fontFamily: "serif",
        fontSize: "42px",
        color: "#d6c3a5",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // =========================
    // SUBTITLE
    // =========================

    const subtitle = this.add
      .text(centerX, centerY + 38, "EXPLORE THE DARKNESS", {
        fontFamily: "serif",
        fontSize: "12px",
        color: "#756653",
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // =========================
    // ANIMATION
    // =========================

    this.tweens.add({
      targets: rose,
      alpha: 1,
      scale: 1,
      duration: 900,
      ease: "Cubic.easeOut",
    });

    // Rose slowly rotates
    this.tweens.add({
      targets: rose,
      angle: 360,
      duration: 5000,
      repeat: -1,
      ease: "Linear",
    });

    // Title
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 700,
      delay: 400,
      ease: "Power2",
    });

    // Subtitle
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 500,
      delay: 700,
      ease: "Power2",
    });

    // =========================
    // GO TO MENU
    // =========================

    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);

      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start("MenuScene");
        },
      );
    });
  }
}
