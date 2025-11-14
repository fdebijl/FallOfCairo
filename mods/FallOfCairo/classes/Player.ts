export class HumanPlayer {
  player: mod.Player;
  team: mod.Team;
  isAlive: boolean = true;
  kills: number = 0;
  deaths: number = 0;
  score: number = 0;

  constructor(player: mod.Player, team: mod.Team) {
    this.player = player;
    this.team = team;
  }

  get id(): number {
    return mod.GetObjId(this.player);
  }
}
