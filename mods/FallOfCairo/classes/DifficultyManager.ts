import { Difficulty } from '../interfaces/Difficulty';

// TODO: Implement difficulty settings
export class DifficultyManager {
  static difficulty: Difficulty;

  static applyDifficultySettings(difficulty: Difficulty) {
    this.difficulty = difficulty;

    switch (difficulty) {
      case Difficulty.Easy: {
        console.log('Applying Easy difficulty settings');
        mod.SetAIToHumanDamageModifier(0.75);
        break;
      }
      case Difficulty.Hard: {
        console.log('Applying Hard difficulty settings');
        mod.SetAIToHumanDamageModifier(1.5);
        break;
      }
      case Difficulty.Medium:
      default: {
        console.log('Apply Medium difficulty settings');
        mod.SetAIToHumanDamageModifier(1.0);
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
        return 200;
      case Difficulty.Medium:
      default:
        return 100;
    }
  }
}
