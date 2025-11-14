import { backfillNATO, isAI } from '../helpers/helpers';
import { HumanPlayer } from './Player';

/**
 * Handles human player related events and data, maintains a list of human players and their state.
 */
export class PlayerHandler {
  static humanPlayers: HumanPlayer[] = [];

  static OnHumanPlayerSpawn(player: mod.Player) {
    if (!player || isAI(player)) {
      return;
    }

    const humanPlayer = this.humanPlayers.find((hp) => hp.id === mod.GetObjId(player));

    if (humanPlayer) {
      humanPlayer.isAlive = true;
    }
  }

  static OnHumanPlayerDeath(player: mod.Player) {
    if (!player || isAI(player)) {
      return;
    }

    const humanPlayer = this.humanPlayers.find((hp) => hp.id === mod.GetObjId(player));

    if (humanPlayer) {
      humanPlayer.isAlive = false;
      humanPlayer.deaths += 1;
    }
  }

  static OnHumanPlayerJoin(player: mod.Player) {
    if (!player || isAI(player)) {
      return;
    }

    const team = mod.GetTeam(player);
    const humanPlayer = new HumanPlayer(player, team);
    this.humanPlayers.push(humanPlayer);

    backfillNATO();
  }

  static OnHumanPlayerLeave(player: mod.Player) {
    if (!player || isAI(player)) {
      return;
    }

    this.humanPlayers = this.humanPlayers.filter((hp) => hp.id !== mod.GetObjId(player));

    backfillNATO();
  }

  static OnHumanPlayerEarnedKill(player: mod.Player) {
    if (!player || isAI(player)) {
      return;
    }

    const humanPlayer = this.humanPlayers.find((hp) => hp.id === mod.GetObjId(player));

    if (humanPlayer) {
      humanPlayer.kills += 1;
    }
  }
}
