import { CAPTURE_POINTS, TEAMS } from '../constants';
import { Difficulty } from '../interfaces/Difficulty';

export class DifficultyManager {
  static difficulty: Difficulty;

  /** True once a difficulty has been locked in, either by a player or by the fallback. */
  static hasBeenChosen: boolean = false;

  /** Getter rather than a field so the enum is never read before it is declared. */
  static get defaultDifficulty(): Difficulty {
    return Difficulty.Medium;
  }

  /**
   * Locks in the difficulty for the rest of the match. The first call wins, so a second
   * player hammering another button (or the fallback firing late) can't change it.
   */
  static chooseDifficulty(difficulty: Difficulty, chosenBy?: mod.Player): boolean {
    if (this.hasBeenChosen) {
      return false;
    }

    this.hasBeenChosen = true;
    console.log(`Difficulty ${difficulty} chosen by ${chosenBy ? mod.GetObjId(chosenBy) : 'fallback'}`);

    this.applyDifficultySettings(difficulty);
    this.applyBotHealthToLivingBots();

    return true;
  }

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

  /**
   * Bot health is normally applied at spawn time, so the NATO backfill bots that are
   * already on the field when the difficulty is picked would keep the default values.
   */
  private static applyBotHealthToLivingBots() {
    const players = mod.AllPlayers();
    const playerCount = mod.CountOf(players);
    const natoTeamId = mod.GetObjId(mod.GetTeam(TEAMS.NATO));

    for (let i = 0; i < playerCount; i++) {
      const player = mod.ValueInArray(players, i);

      if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
        continue;
      }

      const isNato = mod.GetObjId(mod.GetTeam(player)) === natoTeamId;
      mod.SetPlayerMaxHealth(player, isNato ? this.natoBotsHealth : this.paxBotsHealth);
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
