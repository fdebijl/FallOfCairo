export class BotPlayer {
  player: mod.Player;
  team: mod.Team;
  currentTargetPosition?: mod.Vector;

  constructor(player: mod.Player, team: mod.Team) {
    this.player = player;
    this.team = team;
  }
}
