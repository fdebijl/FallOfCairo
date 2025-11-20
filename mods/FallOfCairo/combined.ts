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

  return mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
}

function isObjectIDsEqual(left: mod.Object, right: mod.Object): boolean {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}

function IsAIAllowedVehicle(vehicle: mod.Vehicle) {
  return mod.CompareVehicleName(vehicle, mod.VehicleList.M2Bradley)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams);
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
    BotHandler.botPlayers = BotHandler.botPlayers.filter(bot => mod.GetSoldierState(bot.player, mod.SoldierStateBool.IsAlive));
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
      BotHandler.DirectAiToAttackPoint(newAIProfile, targetPos, true)

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

  // TODO: Might also want to use DirectAiToAttackPoint instead of AISetTarget
  static async VehicleSpawned(vehicle: mod.Vehicle) {
    // Ensure there's some AI around
    await mod.Wait(3);

    const MAX_DISTANCE_FOR_ENTRY = 75;
    const DESIRED_OCCUPANT_COUNT = 2;
    const FIRST_AVAILABLE_SEAT = -1;

    const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const aiPlayers = BotHandler.botPlayers;
    const humanPlayer = PlayerHandler.humanPlayers[0];

    let entered = 0, occupants = [];

    for (let index = 0; index < aiPlayers.length; index++) {
      const aiPlayer = aiPlayers[index];
      const aiPlayerpos = mod.GetSoldierState(aiPlayer.player, mod.SoldierStateVector.GetPosition);
      const aiTeam = mod.GetTeam(aiPlayer.player);

      // Only PAX AI should enter PAX vehicles
      if (!isObjectIDsEqual(aiTeam, mod.GetTeam(TEAMS.PAX_ARMATA))) {
        continue;
      }

      if (mod.DistanceBetween(aiPlayerpos, vehPos) < MAX_DISTANCE_FOR_ENTRY && entered < DESIRED_OCCUPANT_COUNT) {
        console.log(`Directing AI ${mod.GetObjId(aiPlayer.player)} to enter vehicle ${mod.GetObjId(vehicle)}`);
        // mod.AISetTarget(aiPlayer.player, humanPlayer.player);
        mod.ForcePlayerToSeat(aiPlayer.player, vehicle, FIRST_AVAILABLE_SEAT)
        // mod.AIBattlefieldBehavior(aiPlayer.player);

        entered = modlib.ConvertArray(mod.GetAllPlayersInVehicle(vehicle)).length;
        occupants.push(aiPlayer);
      } else if (entered >= DESIRED_OCCUPANT_COUNT) {
        break;
      }

      await mod.Wait(1);
    }


    await mod.Wait(1);
    console.log(`Vehicle ${mod.GetObjId(vehicle)} has ${entered} occupants after entry attempts.`);
    for (const occupant of occupants) {
      this.DirectAiToAttackPoint(occupant, targetPos, false, 25)
    }
  }

  static async DirectAiToAttackPoint(botPlayer: BotPlayer, targetPosition: mod.Vector, defendOnArrival = false, maxStep = 25) {
    botPlayer.currentTargetPosition = targetPosition;

    mod.AISetMoveSpeed(botPlayer.player, mod.MoveSpeed.InvestigateRun);

    while (mod.GetSoldierState(botPlayer.player, mod.SoldierStateBool.IsAlive)) {
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
}

// ===== classes\DifficultyManager.ts =====
// TODO: Implement difficulty settings
class DifficultyManager {
  static difficulty: Difficulty;

  static applyDifficultySettings(difficulty: Difficulty) {
    this.difficulty = difficulty;

    switch (difficulty) {
      case Difficulty.Easy: {
        console.log('Applying Easy difficulty settings');
        mod.SetAIToHumanDamageModifier(0.75);
        break;
      }
      case Difficulty.Hard: {
        console.log('Applying Hard difficulty settings');
        mod.SetAIToHumanDamageModifier(1.5);
        break;
      }
      case Difficulty.Medium:
      default: {
        console.log('Apply Medium difficulty settings');
        mod.SetAIToHumanDamageModifier(1.0);
        break;
      }
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
        return 200;
      case Difficulty.Medium:
      default:
        return 100;
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

// ===== classes\WaveManager.ts =====
class WaveManager {
  nextWaveStartsAtSeconds: number = FIRST_WAVE_START_TIME;
  uiManager: UIManager;
  waves: Wave[];
  currentWave: Wave | null = null;
  canAdvanceWave: boolean = true;

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
    for (const wave of this.waves) {
      if (this.elapsedMatchTimeSeconds >= this.nextWaveStartsAtSeconds && this.canAdvanceWave) {
        this.canAdvanceWave = false;
        await this.SpawnWave(wave);

        // Remove the wave from the list to prevent re-spawning
        this.waves.splice(this.waves.indexOf(wave), 1);
      }
    }

    if (this.hasWaves && this.hasNoAIAlive) {
      // All bots from the current wave have been killed, prepare for the next wave
      const nextWave = this.waves[0];

      if (this.nextWaveStartsAtSeconds <= this.elapsedMatchTimeSeconds) {
        // Next wave hasn't been scheduled yet, do it now
        this.nextWaveStartsAtSeconds = this.elapsedMatchTimeSeconds + INTERMISSION_DURATION_SECONDS;
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

    if (this.hasNoAIAlive && this.hasNoWaves) {
      triggerVictory(this.uiManager);
    }
  }

  async SpawnWave(wave: Wave) {
    console.log(`Spawning wave ${wave.waveNumber} at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);

    this.currentWave = wave;
    await this.SetWaveDetailsUI(wave, true);

    this.SpawnWaveVehicles(wave);
    await this.SpawnWaveInfantry(wave);
  }

  private async SpawnWaveInfantry(wave: Wave) {
        if (wave.spawnPoints && wave.infantryCounts) {
      const maxInfantryCount = Math.max(...wave.infantryCounts);

      for (let round = 0; round < maxInfantryCount; round++) {
        for (const spawnPointId of wave.spawnPoints) {
          const index = wave.spawnPoints.indexOf(spawnPointId);
          const infantryPerSpawnPoint = wave.infantryCounts[index] || 0;

          if (round < infantryPerSpawnPoint) {
            const spawnPoint = mod.GetSpawner(spawnPointId);
            BotHandler.SpawnAI(spawnPoint);
            await mod.Wait(INTERSPAWN_DELAY);
          }
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
          await mod.Wait(10);
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
const VERSION = '1.1.0';

const INTERMISSION_DURATION_SECONDS = 30;
const FIRST_WAVE_START_TIME = 60;

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
    infantryCounts: [10],
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
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE, VEHICLE_SPAWN_POINTS.MAIN_STREET],
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
    // vehicleTypes: [mod.VehicleList.M2Bradley],
    // vehicleCounts: [3],
    // vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE],
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
    // vehicleTypes: [mod.VehicleList.M2Bradley],
    // vehicleCounts: [3],
    // vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE],
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
    // vehicleTypes: [mod.VehicleList.M2Bradley],
    // vehicleCounts: [4],
    // vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE],
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
    // vehicleTypes: [mod.VehicleList.M2Bradley],
    // vehicleCounts: [4],
    // vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE],
  },
]

const INTERSPAWN_DELAY = 1;

// ===== helpers\setup.ts =====
/** Run all one-time setup methods */
async function Setup(uiManager: UIManager): Promise<void> {
  SetupScoreboard();
  SetupEmplacements();

  DifficultyManager.applyDifficultySettings(Difficulty.Medium);

  uiManager.ShowIntroWidget();
  await mod.Wait(10);
  uiManager.HideIntroWidget();
  uiManager.ShowWaveInfoWidget();

  // TODO: This is not adding too much right now, let's work on a proper loot system later
  // const lootSpawner1 = mod.GetLootSpawner(700);
  // mod.SpawnLoot(lootSpawner1, mod.Gadgets.CallIn_UAV_Overwatch);
  // const lootSpawner2 = mod.GetLootSpawner(701);
  // mod.SpawnLoot(lootSpawner2, mod.Gadgets.CallIn_Air_Strike);
  // const lootSpawner3 = mod.GetLootSpawner(702);
  // mod.SpawnLoot(lootSpawner3, mod.Gadgets.CallIn_Ammo_Drop);
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

  // Almost all of these are currently broken, seemingly
  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);

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
  await BotHandler.VehicleSpawned(vehicle);
}

export async function OnPlayerEnterVehicle(player: mod.Player, vehicle: mod.Vehicle) {
  const isBot = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
  const isAIAllowedToDriveThis = IsAIAllowedVehicle(vehicle);

  if (isBot && !isAIAllowedToDriveThis) {
    await mod.Wait(0.5);
    mod.ForcePlayerExitVehicle(player);
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

// ===== interfaces\UI\DefeatWidget.ts =====
const DefeatWidgetDefinition = {
  name: "Container_Defeat",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: true,
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

// ===== interfaces\UI\IntroWidget.ts =====
const IntroWidgetDefinition = {
  name: "Container_Intro",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: true,
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

  constructor() {
    (function parseWaveInfoWidgetDefinition() { modlib.ParseUI(WaveInfoWidgetDefinition) })();
    (function parseIntroWidgetDefinition()    { modlib.ParseUI(IntroWidgetDefinition)    })();
    (function parseVictoryWidgetDefinition()  { modlib.ParseUI(VictoryWidgetDefinition)  })();
    (function parseDefeatWidgetDefinition()   { modlib.ParseUI(DefeatWidgetDefinition)   })();

    this.waveInfoWidgetContainer = mod.FindUIWidgetWithName('Container_WaveInfo');
    this.waveInfoWidgetWaveNumber = mod.FindUIWidgetWithName('Text_WaveInfo_WaveNumber');
    this.waveInfoWidgetWaveDetails = mod.FindUIWidgetWithName('Text_WaveInfo_WaveDetails');
    this.waveInfoWidgetWaveTime = mod.FindUIWidgetWithName('Text_WaveInfo_WaveTime');
    this.introWidgetContainer = mod.FindUIWidgetWithName('Container_Intro');
    this.victoryWidgetContainer = mod.FindUIWidgetWithName('Container_Victory');
    this.defeatWidgetContainer = mod.FindUIWidgetWithName('Container_Defeat');

    mod.SetUIWidgetBgFill(this.waveInfoWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.introWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.victoryWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.defeatWidgetContainer, mod.UIBgFill.Blur);

    mod.SetUIWidgetVisible(this.waveInfoWidgetContainer, false);
    mod.SetUIWidgetVisible(this.introWidgetContainer, false);
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
    mod.SetUIWidgetVisible(this.defeatWidgetContainer, false);
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
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, true);
  }

  HideVictoryWidget() {
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
  }

  ShowDefeatWidget() {
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
}

// ===== interfaces\UI\VictoryWidget.ts =====
const VictoryWidgetDefinition = {
  name: "Container_Victory",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: true,
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
  visible: true,
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