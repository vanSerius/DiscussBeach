import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { HEX } from '../utils/Colors';
import { drawSynthwaveBackground } from '../visuals/Background';
import { Difficulty } from './TitleScene';

interface ResultData {
  winner: 'left' | 'right';
  difficulty: Difficulty;
  scoreLeft: number;
  scoreRight: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data: ResultData): void {
    drawSynthwaveBackground(this, GAME_WIDTH, GAME_HEIGHT);

    const playerWon = data.winner === 'left';
    const headline = playerWon ? 'YOU WIN' : 'AI WINS';
    const color = playerWon ? HEX.cyan : HEX.magenta;

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, headline, {
        fontFamily: 'Courier New, monospace',
        fontSize: '120px',
        color,
        stroke: HEX.white,
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    title.setShadow(0, 0, color, 28, true, true);

    this.tweens.add({
      targets: title,
      scale: { from: 0.6, to: 1 },
      duration: 350,
      ease: 'Back.easeOut',
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, `${data.scoreLeft} : ${data.scoreRight}  ·  ${data.difficulty.toUpperCase()}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '36px',
        color: HEX.sun,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 120, 'PRESS SPACE OR ENTER TO PLAY AGAIN', {
        fontFamily: 'Courier New, monospace',
        fontSize: '22px',
        color: HEX.white,
      })
      .setOrigin(0.5);

    const goTitle = (): void => {
      this.scene.start('TitleScene');
    };
    this.input.keyboard?.on('keydown-SPACE', goTitle);
    this.input.keyboard?.on('keydown-ENTER', goTitle);
    this.input.keyboard?.on('keydown-ESC', goTitle);
  }
}
