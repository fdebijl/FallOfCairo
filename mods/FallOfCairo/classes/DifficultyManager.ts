import { CAPTURE_POINTS } from '../constants';
import { Difficulty } from '../interfaces/Difficulty';
import { PlayerHandler } from './PlayerHandler';

// TODO: Implement difficulty settings
export class DifficultyManager {
  static difficulty: Difficulty;

  static applyDifficultySettings(difficulty: Difficulty) {
    this.difficulty = difficulty;

    const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);

    switch (difficulty) {
      case Difficulty.Easy: {
        console.log('Applying Easy difficulty settings');
        mod.SetAIToHumanDamageModifier(0.75);
        mod.SetCapturePointCapturingTime(capturePoint, 120);
        mod.SetCapturePointNeutralizationTime(capturePoint, 120);
        break;
      }
      case Difficulty.Hard: {
        console.log('Applying Hard difficulty settings');
        mod.SetAIToHumanDamageModifier(1.2);
        mod.SetCapturePointCapturingTime(capturePoint, 30);
        mod.SetCapturePointNeutralizationTime(capturePoint, 30);
        break;
      }
      case Difficulty.Medium:
      default: {
        console.log('Apply Medium difficulty settings');
        mod.SetAIToHumanDamageModifier(0.90);
        mod.SetCapturePointCapturingTime(capturePoint, 90);
        mod.SetCapturePointNeutralizationTime(capturePoint, 90);
        break;
      }
    }
  }

  static get natoBotsHealth(): number {
    switch (this.difficulty) {
      case Difficulty.Easy:
        return 300;
      case Difficulty.Hard:
        return 75;
      case Difficulty.Medium:
      default:
        return 150;
    }
  }

  static get paxBotsHealth(): number {
    switch (this.difficulty) {
      case Difficulty.Easy:
        return 75;
      case Difficulty.Hard:
        return 150;
      case Difficulty.Medium:
      default:
        return 90;
    }
  }
}
