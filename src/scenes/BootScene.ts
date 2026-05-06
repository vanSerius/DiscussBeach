import Phaser from 'phaser';
import { COLORS } from '../utils/Colors';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.generateTextures();
  }

  create(): void {
    this.scene.start('TitleScene');
  }

  private generateTextures(): void {
    this.makeDiscusTexture();
    this.makeParticleTexture();
    this.makeItemTextures();
  }

  private makeDiscusTexture(): void {
    const g = this.add.graphics();
    const r = 18;
    g.fillStyle(COLORS.cyan, 1);
    g.fillCircle(r, r, r);
    g.fillStyle(COLORS.white, 1);
    g.fillCircle(r, r, r * 0.55);
    g.fillStyle(COLORS.magenta, 1);
    g.fillCircle(r, r, r * 0.25);
    g.generateTexture('discus', r * 2, r * 2);
    g.destroy();
  }

  private makeParticleTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  private makeItemTextures(): void {
    const items: { key: string; color: number; symbol: string }[] = [
      { key: 'item_curve', color: COLORS.magenta, symbol: '~' },
      { key: 'item_multi', color: COLORS.cyan, symbol: '3' },
      { key: 'item_slow', color: COLORS.purple, symbol: 'S' },
      { key: 'item_mirror', color: COLORS.sun, symbol: 'M' },
      { key: 'item_magnet', color: COLORS.cyan, symbol: 'O' },
      { key: 'item_shrink', color: COLORS.magenta, symbol: 'v' },
    ];
    for (const it of items) {
      const g = this.add.graphics();
      g.lineStyle(3, it.color, 1);
      g.fillStyle(COLORS.night, 0.85);
      g.fillRoundedRect(0, 0, 40, 40, 8);
      g.strokeRoundedRect(0, 0, 40, 40, 8);
      g.generateTexture(it.key, 40, 40);
      g.destroy();
    }
  }
}
