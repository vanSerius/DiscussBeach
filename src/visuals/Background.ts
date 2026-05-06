import Phaser from 'phaser';
import { COLORS } from '../utils/Colors';

export function drawSynthwaveBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);

  const sky = scene.add.graphics();
  for (let y = 0; y < height * 0.55; y++) {
    const t = y / (height * 0.55);
    const r = Math.floor(13 + (255 - 13) * t * 0.4);
    const g = Math.floor(2 + (0 - 2) * t);
    const b = Math.floor(33 + (110 - 33) * t * 0.6);
    sky.fillStyle((r << 16) | (g << 8) | b, 1);
    sky.fillRect(0, y, width, 1);
  }
  container.add(sky);

  const sun = scene.add.graphics();
  const cx = width / 2;
  const cy = height * 0.42;
  const radius = 160;
  for (let i = 18; i >= 0; i--) {
    const tt = i / 18;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(COLORS.magenta),
      Phaser.Display.Color.IntegerToColor(COLORS.sun),
      18,
      i,
    );
    sun.fillStyle((color.r << 16) | (color.g << 8) | color.b, 1);
    sun.fillCircle(cx, cy, radius * (0.4 + tt * 0.6));
  }
  const cutter = scene.add.graphics();
  cutter.fillStyle(COLORS.night, 1);
  for (let i = 0; i < 6; i++) {
    cutter.fillRect(cx - radius, cy + 30 + i * 18, radius * 2, 6);
  }
  container.add(sun);
  container.add(cutter);

  const grid = scene.add.graphics();
  grid.lineStyle(2, COLORS.magenta, 0.85);
  const horizon = height * 0.55;
  const vp = { x: width / 2, y: horizon };
  for (let i = -10; i <= 10; i++) {
    const x = vp.x + (i / 10) * (width * 1.2);
    grid.lineBetween(vp.x, vp.y, x, height + 40);
  }
  for (let i = 0; i < 12; i++) {
    const tt = i / 11;
    const y = horizon + Math.pow(tt, 2.4) * (height - horizon);
    grid.lineBetween(0, y, width, y);
  }
  container.add(grid);

  const sand = scene.add.graphics();
  sand.fillStyle(COLORS.night, 0.55);
  sand.fillRect(0, height * 0.78, width, height * 0.22);
  container.add(sand);

  return container;
}

export function drawArenaOverlay(
  scene: Phaser.Scene,
  width: number,
  height: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(3, COLORS.cyan, 0.7);
  g.strokeRect(20, 60, width - 40, height - 100);

  for (let y = 80; y < height - 50; y += 18) {
    g.lineStyle(2, COLORS.magenta, 0.55);
    g.lineBetween(width / 2, y, width / 2, y + 8);
  }

  const goalH = (height - 100) * 0.55;
  const goalY = (height - goalH) / 2;
  g.lineStyle(6, COLORS.magenta, 1);
  g.lineBetween(20, goalY, 20, goalY + goalH);
  g.lineStyle(6, COLORS.cyan, 1);
  g.lineBetween(width - 20, goalY, width - 20, goalY + goalH);

  return g;
}
