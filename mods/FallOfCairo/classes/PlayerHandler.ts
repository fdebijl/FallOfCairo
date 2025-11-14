import { backfillNATO, isAI } from '../helpers/helpers';
import { HumanPlayer } from './HumanPlayer';

/**
 * Handles human player related events and data, maintains a list of human players and their state.
 */
export class PlayerHandler {
  static humanPlayers: HumanPlayer[] = [];

  static get humanPlayerCount(): number {
    return this.humanPlayers.length;
  }

  static getPlayerById(id: number): HumanPlayer | undefined {
    return this.humanPlayers.find(hp => hp.id === id);
  }

  static OnHumanPlayerSpawn(player: mod.Player) {
    if (!player || isAI(player)) {
      return;
    }

    const humanPlayer = this.humanPlayers.find((hp) => hp.id === mod.GetObjId(player));

    if (humanPlayer) {
      humanPlayer.isAlive = true;
    }

    mod.Wait(2).then(() => {
      mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
      mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
      mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
      mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
      mod.Resupply(player, mod.ResupplyTypes.AmmoCrate);
    });
  }

  static OnHumanPlayerDeath(player: mod.Player, killer?: mod.Player | null) {
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
