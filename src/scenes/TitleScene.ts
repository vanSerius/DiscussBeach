import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../main';
import { HEX, COLORS } from '../utils/Colors';
import { drawSynthwaveBackground } from '../visuals/Background';

export type Difficulty = 'easy' | 'normal' | 'hard';

export class TitleScene extends Phaser.Scene {
  private selectedIndex = 1;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private readonly options: Difficulty[] = ['easy', 'normal', 'hard'];

  constructor() {
    super('TitleScene');
  }

  create(): void {
    drawSynthwaveBackground(this, GAME_WIDTH, GAME_HEIGHT);

    const title = this.add
      .text(GAME_WIDTH / 2, 180, 'DISCUSSBEACH', {
        fontFamily: 'Courier New, monospace',
        fontSize: '96px',
        color: HEX.cyan,
        stroke: HEX.magenta,
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    title.setShadow(0, 0, HEX.magenta, 24, true, true);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.04 },
      yoyo: true,
      repeat: -1,
      duration: 1400,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(GAME_WIDTH / 2, 290, 'NEON BEACH DISCUS · 1 v AI', {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: HEX.sun,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 380, 'SELECT DIFFICULTY', {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        color: HEX.white,
      })
      .setOrigin(0.5);

    this.options.forEach((opt, i) => {
      const t = this.add
        .text(GAME_WIDTH / 2, 440 + i * 56, opt.toUpperCase(), {
          fontFamily: 'Courier New, monospace',
          fontSize: '36px',
          color: HEX.white,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', () => this.confirm());
      this.optionTexts.push(t);
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 120, 'W/S: aim & move  |  A/D: forward/back  |  SPACE: catch & throw (hold)  |  SHIFT: boost', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: HEX.cyan,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 90, '1/2/3: use items  |  ENTER: confirm  |  UP/DOWN: select', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: HEX.cyan,
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-UP', () => this.select(this.selectedIndex - 1));
    this.input.keyboard?.on('keydown-DOWN', () => this.select(this.selectedIndex + 1));
    this.input.keyboard?.on('keydown-W', () => this.select(this.selectedIndex - 1));
    this.input.keyboard?.on('keydown-S', () => this.select(this.selectedIndex + 1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirm());

    this.refreshSelection();
  }

  private select(idx: number): void {
    const len = this.options.length;
    this.selectedIndex = ((idx % len) + len) % len;
    this.refreshSelection();
  }

  private refreshSelection(): void {
    this.optionTexts.forEach((t, i) => {
      const sel = i === this.selectedIndex;
      t.setColor(sel ? HEX.magenta : HEX.white);
      t.setScale(sel ? 1.15 : 1);
      t.setShadow(0, 0, HEX.magenta, sel ? 18 : 0, true, true);
    });
  }

  private confirm(): void {
    const difficulty = this.options[this.selectedIndex];
    this.cameras.main.flash(220, (COLORS.magenta >> 16) & 0xff, (COLORS.magenta >> 8) & 0xff, COLORS.magenta & 0xff);
    this.time.delayedCall(220, () => this.scene.start('GameScene', { difficulty }));
  }
}
