import { CAPTURE_POINTS, TEAMS } from '../constants';
import { isObjectIDsEqual } from '../helpers/helpers';
import { BotPlayer } from './BotPlayer';
import { DifficultyManager } from './DifficultyManager';

export class BotHandler {
  static maxAmountOfAi = 32;
  static botPlayers: BotPlayer[] = [];
  static MaxRadius = 5;
  static MinRadius = 0;
  static SwitchRadius = 25;

  static get botPlayerCount() {
    return BotHandler.botPlayers.length;
  }

  static get paxBotPlayerCount() {
    return BotHandler.botPlayers.filter(
      bp => isObjectIDsEqual(mod.GetTeam(bp.player), mod.GetTeam(TEAMS.PAX_ARMATA))
    ).length;
  }

  static GetBotById(id: number): BotPlayer | undefined {
    return BotHandler.botPlayers.find(bot => bot.id === id);
  }

  static GetSoldierClass() {
    const rand = Math.random();
    if (rand < 0.50) {
      // 50% chance
      return mod.SoldierClass.Assault;
    } else if (rand < 0.75) {
      // 25% chance
      return mod.SoldierClass.Support;
    } else if (rand < 0.90) {
      // 15% chance
      return mod.SoldierClass.Engineer;
    } else {
      // 10% chance
      return mod.SoldierClass.Recon;
    }
  }

  static GetSoldierName() {
    switch (Math.floor(Math.random() * 44)) {
      case 0: return mod.Message(mod.stringkeys.name0)
      case 1: return mod.Message(mod.stringkeys.name1)
      case 2: return mod.Message(mod.stringkeys.name2)
      case 3: return mod.Message(mod.stringkeys.name3)
      case 4: return mod.Message(mod.stringkeys.name4)
      case 5: return mod.Message(mod.stringkeys.name5)
      case 6: return mod.Message(mod.stringkeys.name6)
      case 7: return mod.Message(mod.stringkeys.name7)
      case 8: return mod.Message(mod.stringkeys.name8)
      case 9: return mod.Message(mod.stringkeys.name9)
      case 10: return mod.Message(mod.stringkeys.name10)
      case 11: return mod.Message(mod.stringkeys.name11)
      case 12: return mod.Message(mod.stringkeys.name12)
      case 13: return mod.Message(mod.stringkeys.name13)
      case 14: return mod.Message(mod.stringkeys.name14)
      case 15: return mod.Message(mod.stringkeys.name15)
      case 16: return mod.Message(mod.stringkeys.name16)
      case 17: return mod.Message(mod.stringkeys.name17)
      case 18: return mod.Message(mod.stringkeys.name18)
      case 19: return mod.Message(mod.stringkeys.name19)
      case 20: return mod.Message(mod.stringkeys.name20)
      case 21: return mod.Message(mod.stringkeys.name21)
      case 22: return mod.Message(mod.stringkeys.name22)
      case 23: return mod.Message(mod.stringkeys.name23)
      case 24: return mod.Message(mod.stringkeys.name24)
      case 25: return mod.Message(mod.stringkeys.name25)
      case 26: return mod.Message(mod.stringkeys.name26)
      case 27: return mod.Message(mod.stringkeys.name27)
      case 28: return mod.Message(mod.stringkeys.name28)
      case 29: return mod.Message(mod.stringkeys.name29)
      case 30: return mod.Message(mod.stringkeys.name30)
      case 31: return mod.Message(mod.stringkeys.name31)
      case 32: return mod.Message(mod.stringkeys.name32)
      case 33: return mod.Message(mod.stringkeys.name33)
      case 34: return mod.Message(mod.stringkeys.name34)
      case 35: return mod.Message(mod.stringkeys.name35)
      case 36: return mod.Message(mod.stringkeys.name36)
      case 37: return mod.Message(mod.stringkeys.name37)
      case 38: return mod.Message(mod.stringkeys.name38)
      case 39: return mod.Message(mod.stringkeys.name39)
      case 40: return mod.Message(mod.stringkeys.name40)
      case 41: return mod.Message(mod.stringkeys.name41)
      case 42: return mod.Message(mod.stringkeys.name42)
      case 43: return mod.Message(mod.stringkeys.name43)
      default: return mod.Message(mod.stringkeys.name0)
    };
  }

  static async PurgeBotList(): Promise<void> {
    console.log('Purging bot player list.');
    BotHandler.botPlayers = BotHandler.botPlayers.filter(bot => mod.GetSoldierState(bot.player, mod.SoldierStateBool.IsAlive));
    console.log(`Remaining botPlayers count after purge: ${BotHandler.botPlayers.length}`);
  }

  static async SpawnAI(spawnPoint: mod.Spawner): Promise<void> {
    if (this.botPlayerCount >= BotHandler.maxAmountOfAi) {
      console.log('Max AI limit reached, backing off spawn.');
      await mod.Wait(5);
      return BotHandler.SpawnAI(spawnPoint);
    }

    const team = mod.GetTeam(TEAMS.PAX_ARMATA);
    const soldierClass = this.GetSoldierClass();
    const name = this.GetSoldierName();
    mod.SpawnAIFromAISpawner(spawnPoint, soldierClass, name, team);
  }

  static async OnAIPlayerSpawn(player: mod.Player) {
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const team = mod.GetTeam(player);
    const newAIProfile = { player: player, team }

    if (isObjectIDsEqual(team, mod.GetTeam(TEAMS.PAX_ARMATA))) {
      // PAX AI
      BotHandler.botPlayers.push(newAIProfile)
      BotHandler.DirectAiToAttackPoint(newAIProfile, targetPos)

      await mod.Wait(2);

      mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
      mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
      mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
      mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
      mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
      mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
    } else {
      // NATO AI
      mod.SetPlayerMaxHealth(player, DifficultyManager.natoBotsHealth);
      BotHandler.DirectAiToAttackPoint(newAIProfile, targetPos, true)

      await mod.Wait(2);

      mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
      mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
      mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
      mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
    }
  }

  static OnAIPlayerDied(player: mod.Player) {
    console.log(`AI player ${mod.GetObjId(player)} died, removing from botPlayers list.`);
    BotHandler.botPlayers = BotHandler.botPlayers.filter(bot => bot.id !== mod.GetObjId(player));
    console.log(`Remaining botPlayers count: ${BotHandler.botPlayers.length}`);
  }

  static async VehicleSpawned(vehicle: mod.Vehicle) {
    const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const aiPlayers = BotHandler.botPlayers;

    for (let index = 0; index < aiPlayers.length; index++) {
      const aiPlayer = aiPlayers[index];
      const aiPlayerpos = mod.GetSoldierState(aiPlayer.player, mod.SoldierStateVector.GetPosition);

      if (mod.DistanceBetween(aiPlayerpos, vehPos) < 100) {
        console.log(`Directing AI ${mod.GetObjId(aiPlayer.player)} to enter vehicle ${mod.GetObjId(vehicle)}`);
        mod.ForcePlayerToSeat(aiPlayer.player, vehicle, 0)
        return;
      }
    }
  }

  static async DirectAiToAttackPoint(botPlayer: BotPlayer, targetPosition: mod.Vector, defendOnArrival = false) {
    botPlayer.currentTargetPosition = targetPosition;

    mod.AISetMoveSpeed(botPlayer.player, mod.MoveSpeed.InvestigateRun);

    while (mod.GetSoldierState(botPlayer.player, mod.SoldierStateBool.IsAlive)) {
      const playerPosition = mod.GetSoldierState(botPlayer.player, mod.SoldierStateVector.GetPosition);
      const _targetPosition = BotHandler.AIHelpMoveTowardsPoint(playerPosition, targetPosition);

      mod.AIMoveToBehavior(botPlayer.player, _targetPosition);

      if (mod.DistanceBetween(playerPosition, targetPosition) < BotHandler.SwitchRadius) {
        if (defendOnArrival) {
          mod.AIDefendPositionBehavior(botPlayer.player, targetPosition, BotHandler.MinRadius, BotHandler.MaxRadius);
        } else {
          mod.AIBattlefieldBehavior(botPlayer.player);
        }

        // We no longer have to manage this AI
        return;
      }

      await mod.Wait(10);
    }
  }

  static AIHelpMoveTowardsPoint(
    from: any,
    to: any,
    maxStep: number = 25
  ): any {
    const fx = mod.XComponentOf(from);
    const fy = mod.YComponentOf(from);
    const fz = mod.ZComponentOf(from);

    const tx = mod.XComponentOf(to);
    const ty = mod.YComponentOf(to);
    const tz = mod.ZComponentOf(to);

    const dx = tx - fx;
    const dy = ty - fy;
    const dz = tz - fz;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance <= maxStep) {
      return mod.CreateVector(tx, ty, tz);
    }

    const ratio = maxStep / distance;

    return mod.CreateVector(
      fx + dx * ratio,
      fy + dy * ratio,
      fz + dz * ratio
    );
  }
}
