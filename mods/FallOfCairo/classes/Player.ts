export class HumanPlayer {
  player: mod.Player;
  team: mod.Team;
  isAlive: boolean = true;

  constructor(player: mod.Player, team: mod.Team) {
    this.player = player;
    this.team = team;
  }

  get id(): number {
    return mod.GetObjId(this.player);
  }
}
