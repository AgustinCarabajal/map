export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#08090b");

    const centerX = width / 2;
    const centerY = height / 2;

    // Decorative magic circle
    const circle = this.add.graphics();

    circle.lineStyle(1, 0x8b6f47, 0.35);
    circle.strokeCircle(centerX, centerY - 30, 180);

    circle.lineStyle(1, 0x8b6f47, 0.15);
    circle.strokeCircle(centerX, centerY - 30, 210);

    circle.setAlpha(0);
    circle.setScale(0.8);

    // Game title
    const title = this.add
      .text(centerX, centerY - 130, "GARDEN", {
        fontFamily: "serif",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#d6c3a5",
        stroke: "#08090b",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Subtitle
    const subtitle = this.add
      .text(centerX, centerY - 70, "Beyond the Veil", {
        fontFamily: "serif",
        fontSize: "12px",
        color: "#756653",
        letterSpacing: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Start button
    const startButton = this.add
      .text(centerX, centerY + 30, "START GAME", {
        fontFamily: "serif",
        fontSize: "24px",
        color: "#c9b79c",
        backgroundColor: "#121417",
        padding: {
          x: 35,
          y: 16,
        },
        stroke: "#08090b",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    // Button border
    const buttonBorder = this.add.graphics();
    buttonBorder.lineStyle(1, 0x8b6f47, 0.5);

    buttonBorder.strokeRect(centerX - 100, centerY + 2, 200, 60);

    buttonBorder.setAlpha(0);

    // Hover
    startButton.on("pointerover", () => {
      startButton.setStyle({
        color: "#f0dfbd",
      });

      buttonBorder.clear();
      buttonBorder.lineStyle(1, 0xb89562, 0.9);

      buttonBorder.strokeRect(centerX - 100, centerY + 2, 200, 60);
    });

    startButton.on("pointerout", () => {
      startButton.setStyle({
        color: "#c9b79c",
      });

      buttonBorder.clear();
      buttonBorder.lineStyle(1, 0x8b6f47, 0.5);

      buttonBorder.strokeRect(centerX - 100, centerY + 2, 200, 60);
    });

    // Start game
    startButton.on("pointerdown", () => {
      startButton.disableInteractive();

      this.cameras.main.fadeOut(500, 0, 0, 0);

      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start("DungeonScene");
        },
      );
    });

    // Intro animation
    this.tweens.add({
      targets: circle,
      alpha: 1,
      scale: 1,
      duration: 900,
      ease: "Cubic.easeOut",
    });

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: centerY - 120,
      duration: 800,
      delay: 200,
      ease: "Power2",
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 500,
      ease: "Power2",
    });

    this.tweens.add({
      targets: [startButton, buttonBorder],
      alpha: 1,
      y: "+=10",
      duration: 700,
      delay: 700,
      ease: "Back.easeOut",
    });

    // Subtle circle rotation
    this.tweens.add({
      targets: circle,
      angle: 360,
      duration: 30000,
      repeat: -1,
      ease: "Linear",
    });
  }
}
