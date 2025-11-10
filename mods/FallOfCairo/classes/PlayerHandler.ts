import { HumanPlayer } from './Player';

export class PlayerHandler {
  static humanPlayers: HumanPlayer[] = [];

  static OnHumanPlayerSpawn(player: mod.Player) {
    const team = mod.GetTeam(player);
    const humanPlayer = new HumanPlayer(player, team);
    this.humanPlayers.push(humanPlayer);
  }
}
