import * as modlib from 'modlib';

// ===== classes\Actor.ts =====
class Actor {
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

// ===== helpers\helpers.ts =====
function isAI(player: mod.Player): boolean {
  if (!player) {
    return true;
  }

  // TODO: Might have to return true here instead, unsure
  if (!mod.IsPlayerValid(player)) {
    return false;
  }

  return mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
}

function isObjectIDsEqual(left: mod.Object, right: mod.Object): boolean {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}

function IsAIAllowedVehicle(vehicle: mod.Vehicle) {
  // Must cover every vehicle type spawned in WAVES, otherwise OnPlayerEnterVehicle
  // will kick freshly force-seated PAX bots straight back out.
  return mod.CompareVehicleName(vehicle, mod.VehicleList.CV90)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Leopard)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Marauder_Pax)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Vector);
}

async function triggerDefeat(uiManager: UIManager) {
  const team = mod.GetTeam(TEAMS.PAX_ARMATA);
  uiManager.ShowDefeatWidget();
  freezePlayers();
  await mod.Wait(10);
  mod.EndGameMode(team);
}

async function triggerVictory(uiManager: UIManager) {
  const team = mod.GetTeam(TEAMS.NATO);
  uiManager.ShowVictoryWidget();
  freezePlayers();
  await mod.Wait(10);
  mod.EndGameMode(team);
}

function freezePlayers(): void {
  const players = mod.AllPlayers();
  const playerCount = mod.CountOf(players);

  for (let i = 0; i < playerCount; i++) {
    const player = mod.ValueInArray(players, i);
    const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

    if (isAI) {
      mod.AIEnableTargeting(player, false);
      mod.AIIdleBehavior(player);
    } else {
      mod.EnableAllInputRestrictions(player, true);
    }
  }
}

function unfreezePlayers(): void {
  const players = mod.AllPlayers();
  const playerCount = mod.CountOf(players);

  for (let i = 0; i < playerCount; i++) {
    const player = mod.ValueInArray(players, i);
    const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

    if (isAI) {
      mod.AIEnableTargeting(player, true);
      mod.AIBattlefieldBehavior(player);
    } else {
      mod.EnableAllInputRestrictions(player, false);
    }
  }
}

let isBackFillRunning = false;

/**
 * Maintains a team size of 4 players on NATO team by adding/removing AI bots as needed.
 * Safe to call repeatedly - will adjust bot count based on current human players.
 */
async function backfillNATO(): Promise<void> {
  if (isBackFillRunning) {
    return;
  }

  isBackFillRunning = true;

  try {
    const TARGET_TEAM_SIZE = 4;
    const natoTeam = mod.GetTeam(TEAMS.NATO);

    const allPlayers = mod.AllPlayers();
    const playerCount = mod.CountOf(allPlayers);

    let natoHumanCount = 0;
    let natoBots: mod.Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      const player = mod.ValueInArray(allPlayers, i);
      const playerTeam = mod.GetTeam(player);

      // Check if player is on NATO team
      if (mod.GetObjId(playerTeam) === mod.GetObjId(natoTeam)) {
        const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

        if (isAI) {
          natoBots.push(player);
        } else {
          natoHumanCount++;
        }
      }
    }

    const currentNATOCount = natoHumanCount + natoBots.length;
    const botsNeeded = TARGET_TEAM_SIZE - currentNATOCount;

    if (botsNeeded > 0) {
      console.log(`Spawning ${botsNeeded} NATO bots (current: ${currentNATOCount}, humans: ${natoHumanCount})`);

      const spawner = mod.GetSpawner(AI_SPAWN_POINTS.NATO);

      for (let i = 0; i < botsNeeded; i++) {
        mod.SpawnAIFromAISpawner(spawner, BotHandler.GetSoldierClass(), BotHandler.GetSoldierName(), natoTeam);
        await mod.Wait(2);
      }
    } else if (botsNeeded < 0) {
      const botsToRemove = Math.abs(botsNeeded);
      console.log(`Removing ${botsToRemove} NATO bots (current: ${currentNATOCount}, humans: ${natoHumanCount})`);

      for (let i = 0; i < botsToRemove && i < natoBots.length; i++) {
        mod.Kill(natoBots[i]);
      }
    } else {
      console.log(`NATO team at target size: ${currentNATOCount} (${natoHumanCount} humans, ${natoBots.length} bots)`);
    }
  } catch (error) {
    console.log('Error in backfillNATO:', error);
  } finally {
    isBackFillRunning = false;
  }
}

// ===== classes\BotHandler.ts =====
class BotHandler {
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
    BotHandler.botPlayers = BotHandler.botPlayers.filter(bot => mod.IsPlayerValid(bot.player) && mod.GetSoldierState(bot.player, mod.SoldierStateBool.IsAlive));
  }

  // Callers must await this: the backoff below is the only thing keeping us under
  // maxAmountOfAi, and an unawaited call turns it into a detached retry loop that
  // ignores the caller's spawn pacing entirely.
  static async SpawnAI(spawnPoint: mod.Spawner): Promise<void> {
    while (this.botPlayerCount >= BotHandler.maxAmountOfAi) {
      console.log('Max AI limit reached, backing off spawn.');
      await mod.Wait(5);
    }

    const team = mod.GetTeam(TEAMS.PAX_ARMATA);
    const soldierClass = this.GetSoldierClass();
    const name = this.GetSoldierName();
    mod.SpawnAIFromAISpawner(spawnPoint, soldierClass, name, team);
  }

  static async OnAIPlayerSpawn(player: mod.Player) {
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const team = mod.GetTeam(player);
    const newAIProfile = new BotPlayer(player, team);

    if (isObjectIDsEqual(team, mod.GetTeam(TEAMS.PAX_ARMATA))) {
      // PAX AI
      BotHandler.botPlayers.push(newAIProfile)
      BotHandler.DirectAiToAttackPoint(newAIProfile, targetPos)

      await mod.Wait(2);

      if (mod.IsPlayerValid(player)) {
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
          mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
          mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
          mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
          mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
        }
      }
    } else {
      // NATO AI
      mod.SetPlayerMaxHealth(player, DifficultyManager.natoBotsHealth);
      BotHandler.DirectAiToAttackPoint(newAIProfile, targetPos, false); // False for `defendOnArrival` may seem weird but this produces much better behaviour

      await mod.Wait(2);

      if (mod.IsPlayerValid(player)) {
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
          mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
          mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
        }
      }
    }
  }

  static OnAIPlayerDied(player: mod.Player) {
    BotHandler.botPlayers = BotHandler.botPlayers.filter(bot => bot.id !== mod.GetObjId(player));
  }

  static async VehicleSpawned(vehicle: mod.Vehicle) {
    // Ensure there's some AI around
    await mod.Wait(5);

    const MAX_DISTANCE_FOR_ENTRY = 75;
    const DESIRED_OCCUPANT_COUNT = 2;
    const FIRST_AVAILABLE_SEAT = -1;
    const DRIVER_SEAT = 0;
    const GUNNER_SEAT = 1;

    const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const aiPlayers = BotHandler.botPlayers;

    const occupants: BotPlayer[] = [];

    for (const aiPlayer of aiPlayers) {
      if (occupants.length >= DESIRED_OCCUPANT_COUNT) {
        break;
      }

      // botPlayers only holds PAX AI, but guard anyway so only PAX crew PAX vehicles.
      if (!isObjectIDsEqual(mod.GetTeam(aiPlayer.player), mod.GetTeam(TEAMS.PAX_ARMATA))) {
        continue;
      }

      const aiPlayerPos = mod.GetSoldierState(aiPlayer.player, mod.SoldierStateVector.GetPosition);
      if (mod.DistanceBetween(aiPlayerPos, vehPos) >= MAX_DISTANCE_FOR_ENTRY) {
        continue;
      }

      mod.AIBattlefieldBehavior(aiPlayer.player);
      await mod.Wait(1);

      if (occupants.length === 0) {
        console.log(`Directing AI ${mod.GetObjId(aiPlayer.player)} to enter vehicle ${mod.GetObjId(vehicle)} at seat ${DRIVER_SEAT}`);
        mod.ForcePlayerToSeat(aiPlayer.player, vehicle, DRIVER_SEAT);
      } else if (occupants.length === 1){
        console.log(`Directing AI ${mod.GetObjId(aiPlayer.player)} to enter vehicle ${mod.GetObjId(vehicle)} at seat ${GUNNER_SEAT}`);
        mod.ForcePlayerToSeat(aiPlayer.player, vehicle, GUNNER_SEAT);
      } else {
        // Shouldn't happen, but just in case, try to force them into the first available seat.
        console.log(`Directing AI ${mod.GetObjId(aiPlayer.player)} to enter vehicle ${mod.GetObjId(vehicle)} at first available seat`);
        mod.ForcePlayerToSeat(aiPlayer.player, vehicle, FIRST_AVAILABLE_SEAT);
      }

      await mod.Wait(1);

      // GetVehicleFromPlayer now returns undefined when the bot isn't seated, so we
      // can confirm the seat actually took before treating them as vehicle crew.
      if (mod.IsPlayerValid(aiPlayer.player) && isObjectIDsEqual(mod.GetVehicleFromPlayer(aiPlayer.player), vehicle)) {
        occupants.push(aiPlayer);
        aiPlayer.isVehicleCrew = true;
      }

      await mod.Wait(1);
    }

    console.log(`Vehicle ${mod.GetObjId(vehicle)} has ${occupants.length} occupants after entry attempts.`);
  }


  static OnAIExitVehicle(player: mod.Player) {
    const botPlayer = BotHandler.GetBotById(mod.GetObjId(player));
    if (!botPlayer) {
      return;
    }

    // Bot dismounted (vehicle destroyed/abandoned) but is still alive and not
    // already being directed: resume the on-foot assault instead of idling.
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) && !botPlayer.isBeingDirected) {
      botPlayer.isVehicleCrew = false;
      const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
      BotHandler.DirectAiToAttackPoint(botPlayer, targetPos);
    }
  }

  static async DirectAiToAttackPoint(botPlayer: BotPlayer, targetPosition: mod.Vector, defendOnArrival = false, maxStep = 25) {
    botPlayer.currentTargetPosition = targetPosition;

    // Prevent stacking concurrent move loops on the same bot (spawn, force-seat and
    // vehicle-exit can all target the same bot). All callers use the capture point,
    // so updating currentTargetPosition above is enough for an already-running loop.
    if (botPlayer.isBeingDirected) {
      return;
    }
    botPlayer.isBeingDirected = true;

    try {
      mod.AISetMoveSpeed(botPlayer.player, mod.MoveSpeed.InvestigateRun);

      while (mod.GetSoldierState(botPlayer.player, mod.SoldierStateBool.IsAlive) && !botPlayer.isVehicleCrew) {
        const playerPosition = mod.GetSoldierState(botPlayer.player, mod.SoldierStateVector.GetPosition);
        const _targetPosition = BotHandler.AIHelpMoveTowardsPoint(playerPosition, targetPosition, maxStep);

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
    } finally {
      botPlayer.isBeingDirected = false;
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

// ===== classes\BotPlayer.ts =====
class BotPlayer extends Actor{
  currentTargetPosition?: mod.Vector;
  isBeingDirected?: boolean;
  isVehicleCrew?: boolean;
}

// ===== classes\DifficultyManager.ts =====
class DifficultyManager {
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

// ===== classes\HumanPlayer.ts =====
class HumanPlayer extends Actor {
  isAlive: boolean = true;
  kills: number = 0;
  deaths: number = 0;
  score: number = 0;
}

// ===== classes\PlayerHandler.ts =====
/**
 * Handles human player related events and data, maintains a list of human players and their state.
 */
class PlayerHandler {
  static humanPlayers: HumanPlayer[] = [];

  /** First human to actually deploy this match - they get to pick the difficulty. */
  static firstDeployedHumanPlayer: mod.Player | null = null;

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

    if (!this.firstDeployedHumanPlayer) {
      this.firstDeployedHumanPlayer = player;
    }

    const humanPlayer = this.humanPlayers.find((hp) => hp.id === mod.GetObjId(player));

    if (humanPlayer) {
      humanPlayer.isAlive = true;
    }

    mod.Wait(2).then(() => {
      if (mod.IsPlayerValid(player)) {
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
          mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
          mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
          mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
          mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 9999);
          mod.Resupply(player, mod.ResupplyTypes.AmmoCrate);
        }
      }
    });
  }

  static OnHumanPlayerDeath(player: mod.Player, killer?: mod.Player | null) {
    if (!player || isAI(player)) {
      return;
    }

    uiManager.OnPlayerDeath(player);
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

// ===== classes\Vehicle.ts =====
class Vehicle {
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

// ===== classes\VehicleHandler.ts =====
class VehicleHandler {
  static vehicles: Vehicle[] = [];

  static get vehicleCount() {
    return VehicleHandler.vehicles.length;
  }

  static GetVehicleByID(id: number): Vehicle | undefined {
    return VehicleHandler.vehicles.find(bot => bot.id === id);
  }

  static async VehicleSpawned(vehicle: mod.Vehicle): Promise<void> {
    const team = mod.GetVehicleTeam(vehicle);
    const managedVehicle = new Vehicle(vehicle, team);
    VehicleHandler.vehicles.push(managedVehicle);
  }

  static async PurgeVehicleList() {
    VehicleHandler.vehicles = [];
  }

  static async DestroyVehicles() {
    for await (const vehicle of VehicleHandler.vehicles) {
      if (IsAIAllowedVehicle(vehicle.vehicle)) {
        mod.DealDamage(vehicle.vehicle, 9999);
      }

      await mod.Wait(1);
    }

    VehicleHandler.PurgeVehicleList();
  }
}

// ===== classes\WaveManager.ts =====
class WaveManager {
  nextWaveStartsAtSeconds: number = FIRST_WAVE_START_TIME;
  uiManager: UIManager;
  waves: Wave[];
  currentWave: Wave | null = null;
  canAdvanceWave: boolean = true;
  isSpawning: boolean = false;
  elapsedWaves = 0;

  infantryRemaining = 0;
  vehiclesRemaining = 0;

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
    this.waves = WAVES;

    // Gotta set this here for the first wave since the loop hasn't started yet
    const nextWave = this.waves[0];
    this.infantryRemaining = nextWave.infantryCounts ? nextWave.infantryCounts.reduce((sum, count) => sum + count, 0) : 0;
    this.vehiclesRemaining = nextWave.vehicleCounts ? nextWave.vehicleCounts.reduce((sum, count) => sum + count, 0) : 0;
  }

  get elapsedMatchTimeSeconds(): number {
    return mod.GetMatchTimeElapsed();
  }

  get enemyAICount(): number {
    return BotHandler.paxBotPlayerCount;
  }

  get hasNoAIAlive(): boolean {
    return this.enemyAICount === 0;
  }

  get hasAIAlive(): boolean {
    return !this.hasNoAIAlive;
  }

  get hasNoWaves(): boolean {
    return WAVES.length === 0;
  }

  get hasWaves(): boolean {
    return !this.hasNoWaves;
  }

  async DoWaveLoop() {
    // Waves are chronological and only one can ever be pending, so waves[0] is the
    // only candidate. Removing it up front keeps hasWaves accurate while it spawns.
    const pendingWave = this.waves[0];

    if (pendingWave && this.canAdvanceWave && this.elapsedMatchTimeSeconds >= this.nextWaveStartsAtSeconds) {
      this.canAdvanceWave = false;
      this.waves.splice(0, 1);
      this.elapsedWaves++;

      // Deliberately not awaited: spawning a wave takes infantryCount *
      // INFANTRY_INTERSPAWN_DELAY seconds, which would stall this whole tick loop
      // (and with it the UI and the victory check) for minutes at a time. isSpawning
      // is set synchronously inside SpawnWave, before the first await, so the checks
      // below already see it on this pass.
      this.SpawnWave(pendingWave);
    }

    if (this.hasWaves && this.hasNoAIAlive && !this.isSpawning) {
      // All bots from the current wave have been killed, prepare for the next wave
      const nextWave = this.waves[0];

      if (this.nextWaveStartsAtSeconds <= this.elapsedMatchTimeSeconds) {
        // Scheduling the next wave pushes nextWaveStartsAtSeconds into the future, so
        // this branch runs exactly once per cleared wave - the right spot to announce it.
        this.AnnounceWaveCleared();

        // Next wave hasn't been scheduled yet, do it now
        this.nextWaveStartsAtSeconds = this.elapsedMatchTimeSeconds + INTERMISSION_DURATION_SECONDS + (INTERMISSION_ADDITIONAL_SECONDS_PER_WAVE * this.elapsedWaves);
        this.infantryRemaining = nextWave.infantryCounts ? nextWave.infantryCounts.reduce((sum, count) => sum + count, 0) : 0;
        this.vehiclesRemaining = nextWave.vehicleCounts ? nextWave.vehicleCounts.reduce((sum, count) => sum + count, 0) : 0;
        this.canAdvanceWave = true;
      }

      const timeUntilNextWave = this.nextWaveStartsAtSeconds - this.elapsedMatchTimeSeconds;

      if (timeUntilNextWave <= 1) {
        // Wave is gonna start between now and the next tick, hide the UI
        this.uiManager.HideWaveTime();
        await this.SetWaveDetailsUI(nextWave, true);
        return;
      } else {
        // Show the details for the upcoming wave
        this.SetWaveDetailsUI(nextWave, false);
        this.uiManager.UpdateWaveInfoTime(timeUntilNextWave);
        this.uiManager.ShowWaveTime();
      }
    } else {
      // Wave is still ongoing or there are no more waves
      if (this.currentWave) {
        await this.SetWaveDetailsUI(this.currentWave, true);
      }

      this.uiManager.HideWaveTime();
    }

    // isSpawning guards against the final wave winning the match the instant it starts,
    // before any of its bots have registered as alive.
    if (this.hasNoAIAlive && this.hasNoWaves && !this.isSpawning) {
      triggerVictory(this.uiManager);
    }
  }

  private AnnounceWaveCleared() {
    if (!this.currentWave) {
      return;
    }

    console.log(`Wave ${this.currentWave.waveNumber} cleared at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);

    // Not awaited: the banner stays up for WAVE_CLEARED_ANNOUNCEMENT_SECONDS, which
    // would otherwise stall the tick loop for the length of the announcement.
    this.uiManager.AnnounceWaveCleared(this.currentWave.waveNumber, WAVE_CLEARED_ANNOUNCEMENT_SECONDS);
  }

  async DoBeforeSpawnWave() {
    VehicleHandler.DestroyVehicles();
  }

  async SpawnWave(wave: Wave) {
    console.log(`Spawning wave ${wave.waveNumber} at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);

    this.isSpawning = true;
    this.currentWave = wave;

    try {
      await this.SetWaveDetailsUI(wave, true);

      await this.DoBeforeSpawnWave();

      this.SpawnWaveVehicles(wave);
      await this.SpawnWaveInfantry(wave);
    } finally {
      // Nobody awaits SpawnWave, so a throw here would otherwise leave isSpawning
      // stuck and the wave loop deadlocked.
      this.isSpawning = false;
    }
  }

  private async SpawnWaveInfantry(wave: Wave) {
    if (!wave.spawnPoints || !wave.infantryCounts) {
      return;
    }

    const maxInfantryCount = Math.max(...wave.infantryCounts);
    let hasSpawnedAny = false;

    for (let round = 0; round < maxInfantryCount; round++) {
      for (let index = 0; index < wave.spawnPoints.length; index++) {
        const infantryPerSpawnPoint = wave.infantryCounts[index] || 0;

        if (round < infantryPerSpawnPoint) {
          // Delay before the spawn rather than after it, so we don't idle for an
          // extra INFANTRY_INTERSPAWN_DELAY once the final bot is out.
          if (hasSpawnedAny) {
            await mod.Wait(INFANTRY_INTERSPAWN_DELAY);
          }

          const spawnPoint = mod.GetSpawner(wave.spawnPoints[index]);
          // Awaited so the AI-cap backoff inside SpawnAI stalls this loop instead of
          // spawning a pile of detached retries that burst past the interspawn delay.
          await BotHandler.SpawnAI(spawnPoint);
          hasSpawnedAny = true;
        }
      }
    }
  }

  private async SpawnWaveVehicles(wave: Wave) {
    if (wave.vehicleCounts && wave.vehicleSpawnPoints && wave.vehicleTypes) {
      const maxVehicleCount = Math.max(...wave.vehicleCounts);

      for (let round = 0; round < maxVehicleCount; round++) {
        for (const spawnPointId of wave.vehicleSpawnPoints) {
          const index = wave.vehicleSpawnPoints.indexOf(spawnPointId);
          const vehiclesPerSpawnPoint = wave.vehicleCounts[index] || 0;

          if (round < vehiclesPerSpawnPoint) {
            console.log(`Spawning vehicle for wave ${wave.waveNumber} at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);
            const spawnPoint = mod.GetVehicleSpawner(spawnPointId);
            const vehicleType = wave.vehicleTypes[index];
            mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
            mod.ForceVehicleSpawnerSpawn(spawnPoint);
          }
        }

        if (round < maxVehicleCount - 1) {
          await mod.Wait(VEHICLE_INTERSPAWN_DELAY);
        }
      }
    }
  }

  async SetWaveDetailsUI(wave: Wave, current: boolean) {
    if (current) {
      if (wave.infantryCounts && wave.vehicleCounts) {
        this.uiManager.UpdateWaveInfoMixed(wave.waveNumber, this.infantryRemaining, this.vehiclesRemaining);
      } else if (wave.infantryCounts) {
        this.uiManager.UpdateWaveInfoInfantry(wave.waveNumber, this.infantryRemaining);
      }
    } else {
      const totalInfantry = wave.infantryCounts ? wave.infantryCounts.reduce((sum, count) => sum + count, 0) : 0;
      const totalVehicles = wave.vehicleCounts ? wave.vehicleCounts.reduce((sum, count) => sum + count, 0) : 0;

      if (wave.infantryCounts && wave.vehicleCounts) {
        this.uiManager.UpdateNextWaveInfoMixed(wave.waveNumber, totalInfantry, totalVehicles);
      } else if (wave.infantryCounts) {
        this.uiManager.UpdateNextWaveInfoInfantry(wave.waveNumber, totalInfantry);
      }
    }
  }

  async OnPlayerDied(player: mod.Player) {
    if (isAI(player) && (mod.GetObjId(mod.GetTeam(player)) == TEAMS.PAX_ARMATA)) {
      if (this.infantryRemaining > 0) {
        this.infantryRemaining -= 1;
      }
    }
  }

  async OnVehicleDestroyed(vehicle: mod.Vehicle) {
    this.vehiclesRemaining -= 1;
  }
}

// ===== constants.ts =====
const VERSION = '1.2.0';

const INTERMISSION_DURATION_SECONDS = 30;
const INTERMISSION_ADDITIONAL_SECONDS_PER_WAVE = 5;
const FIRST_WAVE_START_TIME = 60;
const WAVE_CLEARED_ANNOUNCEMENT_SECONDS = 6;
// Difficulty has to be settled before the first wave spawns, since bot health is read at
// spawn time - so the whole prompt (waiting for a human plus their pick) shares one
// deadline with a little slack before FIRST_WAVE_START_TIME.
const DIFFICULTY_SELECT_DEADLINE_SECONDS = FIRST_WAVE_START_TIME - 5;

const CAPTURE_POINTS = {
  HUMAN_CAPTURE_POINT: 100,
}

const SECTORS = {
  HUMAN_SECTOR: 200,
  AI_SECTOR: 201
}

const TEAMS = {
  NATO: 1,
  PAX_ARMATA: 2,
}

const AI_SPAWN_POINTS = {
  MAIN_STREET: 300,
  MOSQUE: 301,
  FLANK_RIGHT: 302,
  FLANK_LEFT: 303,
  PLAZA: 304,
  NATO: 399
};

const VEHICLE_SPAWN_POINTS = {
  MAIN_STREET: 400,
  MOSQUE: 401,
  FLANK_RIGHT: 402,
  FLANK_LEFT: 403
};

const WEAPON_EMPLACEMENTS: {
  [key: string]: {
    id: number;
    type: mod.StationaryEmplacements;
  }
} = {
  PLAZA_MG_NORTH: { id: 500, type: mod.StationaryEmplacements.M2MG },
  PLAZA_MG_SOUTH: { id: 501, type: mod.StationaryEmplacements.M2MG },
};

const WAVES: Wave[] = [
  {
    waveNumber: 1,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET],
    infantryCounts: [10]
  },
  {
    waveNumber: 2,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET],
    infantryCounts: [15],
    vehicleTypes: [mod.VehicleList.Vector],
    vehicleCounts: [1],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MAIN_STREET],
  },
  {
    waveNumber: 3,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET, AI_SPAWN_POINTS.MOSQUE],
    infantryCounts: [10, 10],
  },
  {
    waveNumber: 4,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
    ],
    infantryCounts: [8, 8, 6, 6],
  },
  {
    waveNumber: 5,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
    ],
    infantryCounts: [12, 12, 8, 8],
    vehicleTypes: [mod.VehicleList.Vector, mod.VehicleList.Vector],
    vehicleCounts: [1, 1],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.FLANK_RIGHT, VEHICLE_SPAWN_POINTS.FLANK_LEFT],
  },
  {
    waveNumber: 6,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
    ],
    infantryCounts: [14, 14, 12, 12],
    vehicleTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder_Pax],
    vehicleCounts: [1, 1],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.FLANK_RIGHT, VEHICLE_SPAWN_POINTS.MAIN_STREET],
  },
  {
    waveNumber: 7,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
    ],
    infantryCounts: [16, 16, 16, 16],
    vehicleTypes: [mod.VehicleList.CV90],
    vehicleCounts: [1],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MAIN_STREET],
  },
  {
    waveNumber: 8,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
      AI_SPAWN_POINTS.PLAZA
    ],
    infantryCounts: [18, 18, 18, 18],
    vehicleTypes: [mod.VehicleList.CV90, mod.VehicleList.CV90, mod.VehicleList.CV90],
    vehicleCounts: [1, 1, 1],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.FLANK_RIGHT, VEHICLE_SPAWN_POINTS.MAIN_STREET, VEHICLE_SPAWN_POINTS.FLANK_LEFT],
  },
  {
    waveNumber: 9,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
      AI_SPAWN_POINTS.PLAZA
    ],
    infantryCounts: [20, 20, 20, 20],
    vehicleTypes: [mod.VehicleList.CV90],
    vehicleCounts: [3],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MAIN_STREET],
  },
  {
    waveNumber: 10,
    spawnPoints: [
      AI_SPAWN_POINTS.MAIN_STREET,
      AI_SPAWN_POINTS.MOSQUE,
      AI_SPAWN_POINTS.FLANK_RIGHT,
      AI_SPAWN_POINTS.FLANK_LEFT,
      AI_SPAWN_POINTS.PLAZA
    ],
    infantryCounts: [24, 24, 24, 24],
    vehicleTypes: [mod.VehicleList.CV90, mod.VehicleList.CV90, mod.VehicleList.Leopard],
    vehicleCounts: [1, 1, 2],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.FLANK_RIGHT, VEHICLE_SPAWN_POINTS.FLANK_LEFT, VEHICLE_SPAWN_POINTS.MAIN_STREET],
  },
]

// Delay between spawning individual infantry units in a wave, in seconds
const INFANTRY_INTERSPAWN_DELAY = 2;
const VEHICLE_INTERSPAWN_DELAY = 20;

// ===== helpers\setup.ts =====
/** Run all one-time setup methods */
async function Setup(uiManager: UIManager): Promise<void> {
  SetupScoreboard();
  SetupEmplacements();

  // Applied up front so nothing reads an unset difficulty before a player picks one.
  DifficultyManager.applyDifficultySettings(DifficultyManager.defaultDifficulty);

  uiManager.ShowIntroWidget();
  await mod.Wait(10);
  uiManager.HideIntroWidget();
  uiManager.ShowWaveInfoWidget();

  await PromptForDifficulty(uiManager);

  // TODO: This is not adding too much right now, let's work on a proper loot system later
  // const lootSpawner1 = mod.GetLootSpawner(700);
  // mod.SpawnLoot(lootSpawner1, mod.Gadgets.CallIn_UAV_Overwatch);
  // const lootSpawner2 = mod.GetLootSpawner(701);
  // mod.SpawnLoot(lootSpawner2, mod.Gadgets.CallIn_Air_Strike);
  // const lootSpawner3 = mod.GetLootSpawner(702);
  // mod.SpawnLoot(lootSpawner3, mod.Gadgets.CallIn_Ammo_Drop);
}


/**
 * Puts the difficulty menu in front of the first human player who deployed and waits for
 * them to pick one. Falls back to the default difficulty if nobody is there to choose, or
 * if the chooser sits on it, so the match still starts on schedule either way.
 */
async function PromptForDifficulty(uiManager: UIManager): Promise<void> {
  while (!PlayerHandler.firstDeployedHumanPlayer && mod.GetMatchTimeElapsed() < DIFFICULTY_SELECT_DEADLINE_SECONDS) {
    await mod.Wait(1);
  }

  const chooser = PlayerHandler.firstDeployedHumanPlayer;

  if (chooser && mod.IsPlayerValid(chooser)) {
    uiManager.ShowDifficultySelectWidget(chooser);

    // OnPlayerUIButtonEvent is what flips hasBeenChosen.
    while (!DifficultyManager.hasBeenChosen && mod.GetMatchTimeElapsed() < DIFFICULTY_SELECT_DEADLINE_SECONDS) {
      console.log('has diff been chosen?', DifficultyManager.hasBeenChosen);
      await mod.Wait(1);
    }

    uiManager.HideDifficultySelectWidget(chooser);
  }

  if (!DifficultyManager.hasBeenChosen) {
    console.log('No difficulty was picked in time, keeping the default');
    DifficultyManager.chooseDifficulty(DifficultyManager.defaultDifficulty);
  }
}

function SetupScoreboard(): void {
  mod.SetScoreboardType(mod.ScoreboardType.NotSet);
  return;

  // TODO: Flesh this out:
  // - Can we hide PAX?
  // - Set column names
  // - Set scores somewhere
  // - Set number of columns to just three?
  console.log('Setting up scoreboard');
  mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
  mod.SetScoreboardHeader(mod.Message(mod.stringkeys.teamNameNato), mod.Message(mod.stringkeys.teamNamePax));
  mod.SetScoreboardColumnNames(
    mod.Message(mod.stringkeys.scoreboardKills),
    mod.Message(mod.stringkeys.scoreboardDeaths),
    mod.Message(mod.stringkeys.scoreboardScore)
  )
}

function SetupEmplacements() {
  // TODO: EmplacementSpawners only spawn TOW's at the moment, this is a known bug
  return;

  console.log('Setting up weapon emplacements');

  for (const emplacementLocation of Object.values(WEAPON_EMPLACEMENTS)) {
    console.log(`Setting up emplacement at ID ${emplacementLocation.id} with type ${emplacementLocation.type}`);
    const emplacement = mod.GetEmplacementSpawner(emplacementLocation.id);
    mod.SetEmplacementSpawnerType(emplacement, emplacementLocation.type);
    mod.SetEmplacementSpawnerAutoSpawn(emplacement, true);
    mod.SetEmplacementSpawnerRespawnTime(emplacement, 0);
    mod.ForceEmplacementSpawnerSpawn(emplacement);
  }
}

// ===== FallOfCairo.ts =====
export let uiManager: UIManager;
let waveManager: WaveManager;

export async function OnGameModeStarted(): Promise<void> {
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing`);
  uiManager = new UIManager();

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const teamNato = mod.GetTeam(TEAMS.NATO);

  mod.EnableGameModeObjective(capturePoint, true);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);
  uiManager.UpdateCapStateWidget(teamNato, 1);

  mod.DeployAllPlayers();

  await mod.Wait(0.5);
  Setup(uiManager);
  waveManager = new WaveManager(uiManager);

  SlowTick();
  SlowestTick();
}

export async function OnCapturePointCaptured(capturePoint: mod.CapturePoint): Promise<void> {
  const capturePointId = mod.GetObjId(capturePoint);
  const controllingTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint));

  if (capturePointId === CAPTURE_POINTS.HUMAN_CAPTURE_POINT && controllingTeamId === TEAMS.PAX_ARMATA) {
    triggerDefeat(uiManager);
  }
}

export async function OnPlayerDeployed(player: mod.Player) {
  if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
    return BotHandler.OnAIPlayerSpawn(player);
  } else {
    return PlayerHandler.OnHumanPlayerSpawn(player);
  }
}

export async function OnPlayerDied(victim: mod.Player, killer: mod.Player | null, eventDeathType: mod.DeathType, eventWeapon: mod.WeaponUnlock) {
  if (mod.GetSoldierState(victim, mod.SoldierStateBool.IsAISoldier)) {
    BotHandler.OnAIPlayerDied(victim);
    waveManager.OnPlayerDied(victim);
  } else {
    PlayerHandler.OnHumanPlayerDeath(victim, killer);
  }
}

export async function OnVehicleSpawned(vehicle: mod.Vehicle) {
  console.log('Vehicle spawned, checking for nearby AI to enter vehicle');
  // Tell bots to get into the vehicle
  await BotHandler.VehicleSpawned(vehicle);
  // Register the vehicle for later destruction/other management
  await VehicleHandler.VehicleSpawned(vehicle);
}

export async function OnPlayerEnterVehicle(player: mod.Player, vehicle: mod.Vehicle) {
  const isBot = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
  const isAIAllowedToDriveThis = IsAIAllowedVehicle(vehicle);

  if (isBot && !isAIAllowedToDriveThis) {
    await mod.Wait(0.5);
    mod.ForcePlayerExitVehicle(player);
  }
}

export async function OnPlayerExitVehicle(player: mod.Player, _vehicle: mod.Vehicle) {
  if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
    BotHandler.OnAIExitVehicle(player);
  }
}

export async function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, buttonEvent: mod.UIButtonEvent): Promise<void> {
  // Portal hands enum values to event handlers as opaque runtime values, so === and !==
  // never match one - the rest of this codebase compares through GetObjId for the same
  // reason. modlib.Equals is the comparison the runtime honours.
  if (isAI(player) || !modlib.Equals(buttonEvent, mod.UIButtonEvent.ButtonUp)) {
    return;
  }

  const difficulty = uiManager.GetDifficultyForButton(widget);

  console.log(`Button up on ${mod.GetUIWidgetName(widget)}, difficulty ${difficulty}`);

  if (difficulty) {
    DifficultyManager.chooseDifficulty(difficulty, player);
  }
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player): Promise<void> {
  if (isAI(eventPlayer)) {
    // Might want to do something for AI players here later
  } else {
    PlayerHandler.OnHumanPlayerJoin(eventPlayer);
  }
}

export async function OnPlayerLeaveGame(playerId: number): Promise<void> {
  const botPlayer = BotHandler.GetBotById(playerId);
  const humanPlayer = PlayerHandler.getPlayerById(playerId);

  if (botPlayer) {
    // Might want to do something for AI players here later
  } else if(humanPlayer) {
    PlayerHandler.OnHumanPlayerLeave(humanPlayer.player);
  }
}

async function SlowTick() {
  await mod.Wait(1);
  await waveManager.DoWaveLoop();

  const cap = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const team = mod.GetCurrentOwnerTeam(cap)
  const progress = mod.GetCaptureProgress(cap);
  uiManager.UpdateCapStateWidget(team, progress);

  SlowTick();
}

async function SlowestTick() {
  await mod.Wait(10);
  await backfillNATO();
  await BotHandler.PurgeBotList();
  SlowestTick();
}

// ===== interfaces\Difficulty.ts =====
export enum Difficulty {
  Easy = 'EASY',
  Medium = 'MEDIUM',
  Hard = 'HARD',
}

// ===== interfaces\UI\CapStateWidget.ts =====
const CapStateWidgetDefinition = {
  name: "Container_CapState",
  type: "Container",
  position: [0, 0],
  size: [3840, 150],
  anchor: mod.UIAnchor.TopCenter,
  visible: false,
  padding: 0,
  bgColor: [0.2, 0.2, 0.2],
  bgAlpha: 0,
  bgFill: mod.UIBgFill.None,
  children: [
    {
      name: "Text_CapState_Header",
      type: "Text",
      position: [0, 46],
      size: [400, 24],
      anchor: mod.UIAnchor.TopCenter,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_CapState_Header,
      textColor: [0.6549, 0.7216, 0.7529],
      textAlpha: 1,
      textSize: 18,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Box_CapState_Background",
      type: "Container",
      position: [0, 75],
      size: [300, 25],
      anchor: mod.UIAnchor.TopCenter,
      visible: true,
      padding: 0,
      bgColor: [0.0314, 0.0431, 0.0431],
      bgAlpha: 0.3,
      bgFill: mod.UIBgFill.Blur,
      children: [
        {
          name: "Box_CapState_ForeGround",
          type: "Container",
          position: [0, 0],
          size: [0, 25],
          anchor: mod.UIAnchor.CenterLeft,
          visible: true,
          padding: 0,
          bgColor: [1, 0.5137, 0.3804],
          bgAlpha: 0,
          bgFill: mod.UIBgFill.Blur
        }
      ]
    },
    {
      name: "Text_CapState_Status",
      type: "Text",
      position: [0, 104],
      size: [400, 26],
      anchor: mod.UIAnchor.TopCenter,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_CapState_Status,
      textColor: [0.4392, 0.9216, 1],
      textAlpha: 1,
      textSize: 22,
      textAnchor: mod.UIAnchor.Center
    }
  ]
}

// ===== interfaces\UI\DefeatWidget.ts =====
const DefeatWidgetDefinition = {
  name: "Container_Defeat",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: false,
  padding: 0,
  bgColor: [0.251, 0.0941, 0.0667],
  bgAlpha: 0.95,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_DefeatTitle",
      type: "Text",
      position: [0, -26.3],
      size: [1000, 110.61],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_DefeatTitle,
      textColor: [1, 0.5137, 0.3804],
      textAlpha: 1,
      textSize: 100,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_DefeatDescription",
      type: "Text",
      position: [0, 62.9],
      size: [819.26, 70],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_DefeatDescription,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 35,
      textAnchor: mod.UIAnchor.Center
    }
  ]
};

// ===== interfaces\UI\DifficultySelectWidget.ts =====
const DifficultySelectWidgetDefinition = {
  name: "Container_DifficultyMenu",
  type: "Container",
  position: [0, 0],
  size: [3840, 200],
  anchor: mod.UIAnchor.Center,
  visible: false,
  padding: 0,
  bgColor: [0.2, 0.2, 0.2],
  bgAlpha: 1,
  bgFill: mod.UIBgFill.None,
  children: [
    {
      name: "Container_DifficultyButtons",
      type: "Container",
      position: [0, 0],
      size: [600, 200],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.0314, 0.0431, 0.0431],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.Blur,
      children: [
        {
          name: "Text_Difficulty_SelectYour",
          type: "Text",
          position: [0, 0],
          size: [298.12, 50],
          anchor: mod.UIAnchor.TopCenter,
          visible: true,
          padding: 0,
          bgColor: [0.2, 0.2, 0.2],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.None,
          textLabel: mod.stringkeys.Text_Difficulty_SelectYour,
          textColor: [1, 1, 1],
          textAlpha: 1,
          textSize: 24,
          textAnchor: mod.UIAnchor.Center
        },
        {
          name: "Button_DifficultyEasy",
          type: "Button",
          position: [54.31, 75],
          size: [100, 50],
          anchor: mod.UIAnchor.TopLeft,
          visible: true,
          padding: 0,
          bgColor: [1, 1, 1],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.Solid,
          buttonEnabled: true,
          buttonColorBase: [0.2784, 0.4471, 0.2118],
          buttonAlphaBase: 1,
          buttonColorDisabled: [0.1, 0.1, 0.1],
          buttonAlphaDisabled: 0.5,
          buttonColorPressed: [0.2, 0.2, 0.2],
          buttonAlphaPressed: 1,
          buttonColorHover: [0.4, 0.4, 0.4],
          buttonAlphaHover: 1,
          buttonColorFocused: [0.5, 0.5, 0.5],
          buttonAlphaFocused: 1
        },
        {
          name: "Button_DifficultyMedium",
          type: "Button",
          position: [250, 75],
          size: [100, 50],
          anchor: mod.UIAnchor.TopLeft,
          visible: true,
          padding: 0,
          bgColor: [1, 1, 1],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.Solid,
          buttonEnabled: true,
          buttonColorBase: [1, 0.9882, 0.6118],
          buttonAlphaBase: 1,
          buttonColorDisabled: [0.1, 0.1, 0.1],
          buttonAlphaDisabled: 0.5,
          buttonColorPressed: [0.2, 0.2, 0.2],
          buttonAlphaPressed: 1,
          buttonColorHover: [0.4, 0.4, 0.4],
          buttonAlphaHover: 1,
          buttonColorFocused: [0.5, 0.5, 0.5],
          buttonAlphaFocused: 1
        },
        {
          name: "Button_DifficultyHard",
          type: "Button",
          position: [433.63, 75],
          size: [100, 50],
          anchor: mod.UIAnchor.TopLeft,
          visible: true,
          padding: 0,
          bgColor: [1, 1, 1],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.Solid,
          buttonEnabled: true,
          buttonColorBase: [1, 0.5137, 0.3804],
          buttonAlphaBase: 1,
          buttonColorDisabled: [0.1, 0.1, 0.1],
          buttonAlphaDisabled: 0.5,
          buttonColorPressed: [0.2, 0.2, 0.2],
          buttonAlphaPressed: 1,
          buttonColorHover: [0.4, 0.4, 0.4],
          buttonAlphaHover: 1,
          buttonColorFocused: [0.5, 0.5, 0.5],
          buttonAlphaFocused: 1
        },
        {
          name: "Text_Difficulty_Easy",
          type: "Text",
          position: [54.31, 122.69],
          size: [100, 50],
          anchor: mod.UIAnchor.TopLeft,
          visible: true,
          padding: 0,
          bgColor: [0.2, 0.2, 0.2],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.None,
          textLabel: mod.stringkeys.Text_Difficulty_Easy,
          textColor: [1, 1, 1],
          textAlpha: 1,
          textSize: 24,
          textAnchor: mod.UIAnchor.Center
        },
        {
          name: "Text_Difficulty_Medium",
          type: "Text",
          position: [250, 122.69],
          size: [100, 50],
          anchor: mod.UIAnchor.TopLeft,
          visible: true,
          padding: 0,
          bgColor: [0.2, 0.2, 0.2],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.None,
          textLabel: mod.stringkeys.Text_Difficulty_Medium,
          textColor: [1, 1, 1],
          textAlpha: 1,
          textSize: 24,
          textAnchor: mod.UIAnchor.Center
        },
        {
          name: "Text_Difficulty_Hard",
          type: "Text",
          position: [433.63, 122.69],
          size: [100, 50],
          anchor: mod.UIAnchor.TopLeft,
          visible: true,
          padding: 0,
          bgColor: [0.2, 0.2, 0.2],
          bgAlpha: 1,
          bgFill: mod.UIBgFill.None,
          textLabel: mod.stringkeys.Text_Difficulty_Hard,
          textColor: [1, 1, 1],
          textAlpha: 1,
          textSize: 24,
          textAnchor: mod.UIAnchor.Center
        }
      ]
    }
  ]
}

// ===== interfaces\UI\EndOfWaveWidget.ts =====
const EndOfWaveWidgetDefinition = {
  name: "Container_EndOfWave",
  type: "Container",
  position: [0, -260],
  size: [900, 150],
  anchor: mod.UIAnchor.Center,
  visible: false,
  padding: 0,
  bgColor: [0.0745, 0.1843, 0.2471],
  bgAlpha: 0.75,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_EndOfWave_Title",
      type: "Text",
      position: [0, -28],
      size: [860, 70],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_EndOfWave_Title,
      textColor: [0.4392, 0.9216, 1],
      textAlpha: 1,
      textSize: 60,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_EndOfWave_Subtitle",
      type: "Text",
      position: [0, 34],
      size: [860, 45],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_EndOfWave_Subtitle,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 26,
      textAnchor: mod.UIAnchor.Center
    }
  ]
}

// ===== interfaces\UI\IntroWidget.ts =====
const IntroWidgetDefinition = {
  name: "Container_Intro",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: false,
  padding: 0,
  bgColor: [0.0314, 0.0431, 0.0431],
  bgAlpha: 1,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_Intro_Pretitle",
      type: "Text",
      position: [0, -192.11],
      size: [1000, 50],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_Intro_Pretitle,
      textColor: [1, 0.5137, 0.3804],
      textAlpha: 1,
      textSize: 22,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_Intro_Title",
      type: "Text",
      position: [0, -154.37],
      size: [1000, 50],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_Intro_Title,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 30,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_Intro_Instructions1",
      type: "Text",
      position: [0, -70.9],
      size: [650.03, 114.04],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_Intro_Instructions1,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 16,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_Intro_Instructions2",
      type: "Text",
      position: [0, 0],
      size: [650.03, 48.86],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_Intro_Instructions2,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 16,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_Intro_Instructions3",
      type: "Text",
      position: [0, 82.33],
      size: [650.03, 90.03],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_Intro_Instructions3,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 16,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_Intro_Instructions4",
      type: "Text",
      position: [0, 173.81],
      size: [650.03, 48.86],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_Intro_Instructions4,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 18,
      textAnchor: mod.UIAnchor.Center
    }
  ]
};

// ===== interfaces\UI\UIManager.ts =====
class UIManager {
  waveInfoWidgetContainer: mod.UIWidget;
  waveInfoWidgetWaveNumber: mod.UIWidget;
  waveInfoWidgetWaveDetails: mod.UIWidget;
  waveInfoWidgetWaveTime: mod.UIWidget;

  introWidgetContainer: mod.UIWidget;
  victoryWidgetContainer: mod.UIWidget;
  defeatWidgetContainer: mod.UIWidget;
  capStateWidgetContainer: mod.UIWidget;
  capStateWidgetBar: mod.UIWidget;
  capStateWidgetStatus: mod.UIWidget;

  endOfWaveWidgetContainer: mod.UIWidget;
  endOfWaveWidgetSubtitle: mod.UIWidget;

  difficultySelectWidgetContainer: mod.UIWidget;
  difficultySelectEasyButton: mod.UIWidget;
  difficultySelectMediumButton: mod.UIWidget;
  difficultySelectHardButton: mod.UIWidget;

  // Bumped per announcement so a stale auto-hide can't close a newer banner.
  private endOfWaveAnnouncementId = 0;

  // Flips every tick while the point is in danger, driving the status-line flash.
  private capStateFlashOn = false;

  constructor() {
    (function parseWaveInfoWidgetDefinition() { modlib.ParseUI(WaveInfoWidgetDefinition) })();
    (function parseIntroWidgetDefinition()    { modlib.ParseUI(IntroWidgetDefinition)    })();
    (function parseVictoryWidgetDefinition()  { modlib.ParseUI(VictoryWidgetDefinition)  })();
    (function parseDefeatWidgetDefinition()   { modlib.ParseUI(DefeatWidgetDefinition)   })();
    (function parseCapStateWidgetDefinition() { modlib.ParseUI(CapStateWidgetDefinition) })();
    (function parseEndOfWaveWidgetDefinition(){ modlib.ParseUI(EndOfWaveWidgetDefinition) })();
    (function parseDifficultySelectWidgetDefinition(){ modlib.ParseUI(DifficultySelectWidgetDefinition) })();

    this.waveInfoWidgetContainer = mod.FindUIWidgetWithName('Container_WaveInfo');
    this.waveInfoWidgetWaveNumber = mod.FindUIWidgetWithName('Text_WaveInfo_WaveNumber');
    this.waveInfoWidgetWaveDetails = mod.FindUIWidgetWithName('Text_WaveInfo_WaveDetails');
    this.waveInfoWidgetWaveTime = mod.FindUIWidgetWithName('Text_WaveInfo_WaveTime');
    this.introWidgetContainer = mod.FindUIWidgetWithName('Container_Intro');
    this.victoryWidgetContainer = mod.FindUIWidgetWithName('Container_Victory');
    this.defeatWidgetContainer = mod.FindUIWidgetWithName('Container_Defeat');
    this.capStateWidgetContainer = mod.FindUIWidgetWithName('Container_CapState');
    this.capStateWidgetBar = mod.FindUIWidgetWithName('Box_CapState_ForeGround');
    this.capStateWidgetStatus = mod.FindUIWidgetWithName('Text_CapState_Status');
    this.endOfWaveWidgetContainer = mod.FindUIWidgetWithName('Container_EndOfWave');
    this.endOfWaveWidgetSubtitle = mod.FindUIWidgetWithName('Text_EndOfWave_Subtitle');
    this.difficultySelectWidgetContainer = mod.FindUIWidgetWithName('Container_DifficultyMenu');
    this.difficultySelectEasyButton = mod.FindUIWidgetWithName('Button_DifficultyEasy');
    this.difficultySelectMediumButton = mod.FindUIWidgetWithName('Button_DifficultyMedium');
    this.difficultySelectHardButton = mod.FindUIWidgetWithName('Button_DifficultyHard');

    mod.SetUIWidgetBgFill(this.waveInfoWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.introWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.victoryWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.defeatWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.endOfWaveWidgetContainer, mod.UIBgFill.Blur);

    mod.SetUIWidgetVisible(this.waveInfoWidgetContainer, false);
    mod.SetUIWidgetVisible(this.introWidgetContainer, false);
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
    mod.SetUIWidgetVisible(this.defeatWidgetContainer, false);
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, false);
    mod.SetUIWidgetVisible(this.endOfWaveWidgetContainer, false);
    mod.SetUIWidgetVisible(this.difficultySelectWidgetContainer, false);

    // Buttons stay silent until their event is explicitly enabled - without this,
    // OnPlayerUIButtonEvent never fires for them.
    mod.EnableUIButtonEvent(this.difficultySelectEasyButton, mod.UIButtonEvent.ButtonUp, true);
    mod.EnableUIButtonEvent(this.difficultySelectMediumButton, mod.UIButtonEvent.ButtonUp, true);
    mod.EnableUIButtonEvent(this.difficultySelectHardButton, mod.UIButtonEvent.ButtonUp, true);
  }

  ShowWaveInfoWidget() {
    mod.SetUIWidgetVisible(this.waveInfoWidgetContainer, true);
  }

  HideWaveInfoWidget() {
    mod.SetUIWidgetVisible(this.waveInfoWidgetContainer, false);
  }

  ShowIntroWidget() {
    mod.SetUIWidgetVisible(this.introWidgetContainer, true);
  }

  HideIntroWidget() {
    mod.SetUIWidgetVisible(this.introWidgetContainer, false);
  }

  ShowVictoryWidget() {
    this.HideEndOfWaveWidget();
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, true);
  }

  HideVictoryWidget() {
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
  }

  ShowDefeatWidget() {
    this.HideEndOfWaveWidget();
    mod.SetUIWidgetVisible(this.defeatWidgetContainer, true);
  }

  HideDefeatWidget() {
    mod.SetUIWidgetVisible(this.defeatWidgetContainer, false);
  }

  ShowWaveTime() {
    mod.SetUIWidgetVisible(this.waveInfoWidgetWaveTime, true);
  }

  HideWaveTime() {
    mod.SetUIWidgetVisible(this.waveInfoWidgetWaveTime, false);
  }

  ShowCapStateWidget() {
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, true);
  }

  HideCapStateWidget() {
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, false);
  }

  ShowEndOfWaveWidget() {
    mod.SetUIWidgetVisible(this.endOfWaveWidgetContainer, true);
  }

  HideEndOfWaveWidget() {
    mod.SetUIWidgetVisible(this.endOfWaveWidgetContainer, false);
  }

  /**
   * Widgets are global, so everyone sees the menu, but only the chooser gets the cursor
   * that can actually click it - the difficulty is a one-time, match-wide decision.
   */
  ShowDifficultySelectWidget(chooser: mod.Player) {
    mod.SetUIWidgetVisible(this.difficultySelectWidgetContainer, true);
    mod.EnableUIInputMode(true, chooser);
  }

  HideDifficultySelectWidget(chooser: mod.Player) {
    mod.SetUIWidgetVisible(this.difficultySelectWidgetContainer, false);

    // Leaving input mode on would keep the chooser stuck in cursor mode with no UI to
    // click, so this has to run even if they left the match in the meantime.
    if (mod.IsPlayerValid(chooser)) {
      mod.EnableUIInputMode(false, chooser);
    }
  }

  /**
   * Maps a pressed widget onto the difficulty it selects, or null if the press came from
   * some other button entirely.
   */
  GetDifficultyForButton(widget: mod.UIWidget): Difficulty | null {
    switch (mod.GetUIWidgetName(widget)) {
      case 'Button_DifficultyEasy':
        return Difficulty.Easy;
      case 'Button_DifficultyMedium':
        return Difficulty.Medium;
      case 'Button_DifficultyHard':
        return Difficulty.Hard;
      default:
        return null;
    }
  }

  /**
   * Flashes the WAVE CLEARED banner for durationSeconds, then hides it again.
   * Deliberately not awaited by callers - it sleeps for the whole display duration.
   */
  async AnnounceWaveCleared(waveNumber: number, durationSeconds: number) {
    this.endOfWaveAnnouncementId++;
    const announcementId = this.endOfWaveAnnouncementId;

    mod.SetUITextLabel(this.endOfWaveWidgetSubtitle, mod.Message(mod.stringkeys.endOfWaveSubtitle, waveNumber));
    this.ShowEndOfWaveWidget();

    await mod.Wait(durationSeconds);

    // Something newer (another wave clear, victory, defeat) may own the banner by
    // now - only the most recent announcement gets to take it down.
    if (announcementId === this.endOfWaveAnnouncementId) {
      this.HideEndOfWaveWidget();
    }
  }

  UpdateWaveInfoInfantry(waveNumber: number, infantryCountRemaining: number) {
    mod.SetUITextLabel(this.waveInfoWidgetWaveNumber, mod.Message(mod.stringkeys.waveNumber, waveNumber));
    mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.waveDetailsInfantry, infantryCountRemaining));
  }

  UpdateWaveInfoMixed(waveNumber: number, infantryCountRemaining: number, vehicleCountRemaining: number) {
    mod.SetUITextLabel(this.waveInfoWidgetWaveNumber, mod.Message(mod.stringkeys.waveNumber, waveNumber));

    if (vehicleCountRemaining === 1) {
      mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.waveDetailsVehicle, infantryCountRemaining, vehicleCountRemaining));
    } else {
      mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.waveDetailsVehicles, infantryCountRemaining, vehicleCountRemaining));
    }
  }

  UpdateWaveInfoTime(timeRemainingSeconds: number) {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = Math.floor(timeRemainingSeconds % 60);

    if (seconds < 10) {
      mod.SetUITextLabel(this.waveInfoWidgetWaveTime, mod.Message(mod.stringkeys.waveDetailsTimeSingleDigit, minutes, seconds));
    } else {
      mod.SetUITextLabel(this.waveInfoWidgetWaveTime, mod.Message(mod.stringkeys.waveDetailsTime, minutes, seconds));
    }
  }

  UpdateNextWaveInfoInfantry(waveNumber: number, infantryCount: number) {
    mod.SetUITextLabel(this.waveInfoWidgetWaveNumber, mod.Message(mod.stringkeys.nextWaveNumber, waveNumber));
    mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.nextWaveDetailsInfantry, infantryCount));
  }

  UpdateNextWaveInfoMixed(waveNumber: number, infantryCount: number, vehicleCount: number) {
    mod.SetUITextLabel(this.waveInfoWidgetWaveNumber, mod.Message(mod.stringkeys.nextWaveNumber, waveNumber));

    if (vehicleCount === 1) {
      mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.nextWaveDetailsVehicle, infantryCount, vehicleCount));
    } else {
      mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.nextWaveDetailsVehicles, infantryCount, vehicleCount));
    }
  }

  UpdateCapStateWidget(owner: mod.Team, progress: number) {
    this.ShowCapStateWidget();

    const barWidth = 300;
    const barHeight = 25;
    const criticalThreshold = 0.4;

    const percent = Math.round(progress * 100);

    const ownerIsNato = mod.GetObjId(owner) === mod.GetObjId(mod.GetTeam(TEAMS.NATO));

    // The bar and the status line share a colour so the state reads at a glance:
    // NATO cyan while the point is safe, amber once PAX start eating into it, red when
    // it is close to flipping.
    let stateColor: mod.Vector;
    let statusLabel: mod.Message;

    if (!ownerIsNato) {
      stateColor = mod.CreateVector(1, 0.5137, 0.3804);
      statusLabel = mod.Message(mod.stringkeys.capStateOverrun);
    } else if (progress >= 1) {
      stateColor = mod.CreateVector(0.4392, 0.9216, 1);
      statusLabel = mod.Message(mod.stringkeys.capStateSecure, percent);
    } else if (progress >= criticalThreshold) {
      stateColor = mod.CreateVector(1, 0.7843, 0.3373);
      statusLabel = mod.Message(mod.stringkeys.capStateContested, percent);
    } else {
      stateColor = mod.CreateVector(1, 0.3373, 0.2941);
      statusLabel = mod.Message(mod.stringkeys.capStateCritical, percent);
    }

    mod.SetUIWidgetBgAlpha(this.capStateWidgetBar, 1);
    mod.SetUIWidgetBgColor(this.capStateWidgetBar, stateColor);
    mod.SetUIWidgetSize(this.capStateWidgetBar, mod.CreateVector(Math.round(barWidth * progress), barHeight, 0));

    mod.SetUITextLabel(this.capStateWidgetStatus, statusLabel);
    mod.SetUITextColor(this.capStateWidgetStatus, stateColor);

    // This only updates once a second, so an alpha flip between ticks is the only
    // animation available - use it to make a near-lost point demand attention.
    const shouldFlash = !ownerIsNato || progress < criticalThreshold;
    this.capStateFlashOn = shouldFlash ? !this.capStateFlashOn : false;
    mod.SetUITextAlpha(this.capStateWidgetStatus, this.capStateFlashOn ? 0.35 : 1);
  }

  OnPlayerDeath(player: mod.Player) {
    this.HideIntroWidget();
  }
}

// ===== interfaces\UI\VictoryWidget.ts =====
const VictoryWidgetDefinition = {
  name: "Container_Victory",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: false,
  padding: 0,
  bgColor: [0.0745, 0.1843, 0.2471],
  bgAlpha: 0.95,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_VictoryTitle",
      type: "Text",
      position: [0, -26.3],
      size: [1000, 110.61],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_VictoryTitle,
      textColor: [0.4392, 0.9216, 1],
      textAlpha: 1,
      textSize: 100,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_VictoryDescription",
      type: "Text",
      position: [0, 62.9],
      size: [819.26, 70],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_VictoryDescription,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 35,
      textAnchor: mod.UIAnchor.Center
    }
  ]
};

// ===== interfaces\UI\WaveInfoWidget.ts =====
const WaveInfoWidgetDefinition = {
  name: "Container_WaveInfo",
  type: "Container",
  position: [25, 25],
  size: [420, 106],
  anchor: mod.UIAnchor.TopLeft,
  visible: false,
  padding: 5,
  bgColor: [0.2118, 0.2235, 0.2353],
  bgAlpha: 0.6,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_WaveInfo_WaveNumber",
      type: "Text",
      position: [20, 8],
      size: [374.72, 50],
      anchor: mod.UIAnchor.TopLeft,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.waveNumberInit,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 24,
      textAnchor: mod.UIAnchor.CenterLeft
    },
    {
      name: "Text_WaveInfo_WaveDetails",
      type: "Text",
      position: [20, 50],
      size: [367.13, 35],
      anchor: mod.UIAnchor.TopLeft,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.waveDetailsInit,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 20,
      textAnchor: mod.UIAnchor.CenterLeft
    },
    {
      name: "Text_WaveInfo_WaveTime",
      type: "Text",
      position: [290, 8],
      size: [100, 50],
      anchor: mod.UIAnchor.TopLeft,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.waveDetailsTime,
      textColor: [0.8353, 0.9216, 0.9765],
      textAlpha: 1,
      textSize: 24,
      textAnchor: mod.UIAnchor.CenterRight
    }
  ]
}

// ===== interfaces\Wave.ts =====
interface Wave {
  waveNumber: number; // The wave number (for display purposes)
  spawnPoints?: number[]; // AI spawn point IDs
  infantryCounts?: number[]; // Number of infantry to spawn per spawn point
  vehicleCounts?: number[]; // Number of vehicles to spawn per vehicle spawn point
  vehicleTypes?: mod.VehicleList[]; // Types of vehicles to spawn
  vehicleSpawnPoints?: number[]; // Vehicle spawn point IDs
}