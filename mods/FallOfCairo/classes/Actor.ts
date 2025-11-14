export class Actor {
  id?: number;
  player: mod.Player;
  team: mod.Team;

  isAlive?: boolean = true;
  kills?: number = 0;
  deaths?: number = 0;
  score?: number = 0;

  constructor(player: mod.Player, team: mod.Team) {
    this.player = player;
    this.team = team;
    this.id = mod.GetObjId(player);
  }
}
