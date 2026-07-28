export class Vehicle {
  id?: number;
  team: mod.Team;
  vehicle: mod.Vehicle;

  isAlive?: boolean = true;
  kills?: number = 0;
  deaths?: number = 0;
  score?: number = 0;

  constructor(vehicle: mod.Vehicle, team: mod.Team) {
    this.team = team;
    this.vehicle = vehicle;
    this.id = mod.GetObjId(vehicle);
  }
}
