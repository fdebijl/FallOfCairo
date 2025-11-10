import * as modlib from 'modlib';

// ===== helpers\helpers.ts =====
function IsObjectIDsEqual(left: any, right: any) {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}

function IsAIAllowedVehicle(vehicle: mod.Vehicle) {
  return mod.CompareVehicleName(vehicle, mod.VehicleList.M2Bradley)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams);
}

// ===== classes\AIBehaviorHandler.ts =====
class AIBehaviorHandler {
  static maxAmountOfAi = 32;
  static botPlayers: BotPlayer[] = [];
  static MaxRadius = 25;
  static MinRadius = 5;

  private static GetSoldierClass() {
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

  private static GetSoldierName() {
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

  static async SpawnAI(spawnPoint: mod.Spawner): Promise<void> {
    if (AIBehaviorHandler.botPlayers.length >= AIBehaviorHandler.maxAmountOfAi) {
      console.log('Max AI limit reached, backing off spawn.');
      await mod.Wait(2);
      return AIBehaviorHandler.SpawnAI(spawnPoint);
    }

    const team = mod.GetTeam(TEAMS.PAX_ARMATA);
    const soldierClass = this.GetSoldierClass();
    const name = this.GetSoldierName();
    console.log('Spawning AI soldier');
    mod.SpawnAIFromAISpawner(spawnPoint, soldierClass, name, team);
  }

  static OnAIPlayerSpawn(player: mod.Player) {
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const newAIProfile = { player: player, team: mod.GetTeam(player) }

    AIBehaviorHandler.botPlayers.push(newAIProfile)
    AIBehaviorHandler.DirectAiToAttackPoint(newAIProfile, targetPos)
  }

  static GetAllAIPlayers() {
    let AiPlayers: mod.Player[] = []

    AIBehaviorHandler.botPlayers.forEach(element => {
      AiPlayers.push(element.player)
    });

    return AiPlayers
  }

  static OnAIPlayerDied(player: mod.Player) {
    const index = AIBehaviorHandler.botPlayers.findIndex(x => IsObjectIDsEqual(x.player, player));

    if (index !== -1) {
      AIBehaviorHandler.botPlayers.splice(index, 1);
    }
  }

  static async VehicleSpawned(vehicle: mod.Vehicle) {
    const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const aiPlayers = AIBehaviorHandler.botPlayers;

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

  static async DirectAiToAttackPoint(botPlayer: BotPlayer, targetPosition: mod.Vector) {
    botPlayer.currentTargetPosition = targetPosition;

    mod.AISetMoveSpeed(botPlayer.player, mod.MoveSpeed.InvestigateRun);

    while (mod.GetSoldierState(botPlayer.player, mod.SoldierStateBool.IsAlive)) {
      console.log(`Directing AI ${mod.GetObjId(botPlayer.player)} towards target point`);
      const playerPosition = mod.GetSoldierState(botPlayer.player, mod.SoldierStateVector.GetPosition);
      const _targetPosition = AIBehaviorHandler.AIHelpMoveTowardsPoint(playerPosition, targetPosition);

      mod.AIMoveToBehavior(botPlayer.player, _targetPosition);

      if (mod.DistanceBetween(playerPosition, targetPosition) < AIBehaviorHandler.MaxRadius) {
        console.log(`AI ${mod.GetObjId(botPlayer.player)} reached target point, switching to battlefield behavior`);
        mod.AIBattlefieldBehavior(botPlayer.player);

        // Alternative mode: defend position
        // mod.AIDefendPositionBehavior(aIProfile.player, targetPosition, AIBehaviorHandler.MinRadius, AIBehaviorHandler.MaxRadius);
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
class BotPlayer {
  player: mod.Player;
  team: mod.Team;
  currentTargetPosition?: mod.Vector;

  constructor(player: mod.Player, team: mod.Team) {
    this.player = player;
    this.team = team;
  }
}

// ===== classes\Player.ts =====
class HumanPlayer {
  player: mod.Player;
  team: mod.Team;

  constructor(player: mod.Player, team: mod.Team) {
    this.player = player;
    this.team = team;
  }
}

// ===== classes\PlayerHandler.ts =====
class PlayerHandler {
  static humanPlayers: HumanPlayer[] = [];

  static OnHumanPlayerSpawn(player: mod.Player) {
    const team = mod.GetTeam(player);
    const humanPlayer = new HumanPlayer(player, team);
    this.humanPlayers.push(humanPlayer);
  }
}

// ===== constants.ts =====
const VERSION = '0.1.6';

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
    startsAt: 60,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET],
    infantryCounts: [10],
  },
  {
    waveNumber: 2,
    startsAt: 120,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET, AI_SPAWN_POINTS.MOSQUE],
    infantryCounts: [10, 10],
    vehicleTypes: [mod.VehicleList.M2Bradley],
    vehicleCounts: [1],
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE],
  },
  {
    waveNumber: 3,
    startsAt: 180,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET, AI_SPAWN_POINTS.MOSQUE, AI_SPAWN_POINTS.FLANK_RIGHT, AI_SPAWN_POINTS.FLANK_LEFT],
    infantryCounts: [8, 8, 8, 8],
  }
]

const INTERSPAWN_DELAY = 1;

// ===== helpers\setup.ts =====
/** Run all one-time setup methods */
function Setup(): void {
  SetupScoreboard();
  SetupEmplacements();
}

// TODO: Flesh this out
function SetupScoreboard(): void {
  console.log('Setting up scoreboard');
  mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
  mod.SetScoreboardHeader(mod.Message(mod.stringkeys.teamNameNato), mod.Message(mod.stringkeys.teamNamePax));
}

function SetupEmplacements() {
  // EmplacementSpawners only spawn TOW's at the moment, this is a known bug
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
let uiManager: UIManager;

export async function OnGameModeStarted(): Promise<void> {
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing`);
  mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.announcementTitle));

  uiManager = new UIManager();

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const teamNato = mod.GetTeam(TEAMS.NATO);

  mod.EnableGameModeObjective(capturePoint, true);

  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);

  mod.DeployAllPlayers();

  Setup();
  await mod.Wait(5);

  // FastTick();
  SlowTick();
}

export async function OnCapturePointCaptured(capturePoint: mod.CapturePoint): Promise<void> {
  console.log('Capture point captured, checking conditions');
  const capturePointId = mod.GetObjId(capturePoint);
  const controllingTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint));

  if (capturePointId === CAPTURE_POINTS.HUMAN_CAPTURE_POINT && controllingTeamId === TEAMS.PAX_ARMATA) {
    const teamPax = mod.GetTeam(TEAMS.PAX_ARMATA);
    console.log('Team 2 captured the point, ending game mode with defeat for humans.');
    mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.announcementDefeat));
    await mod.Wait(5);
    mod.EndGameMode(teamPax);
  }
}


export async function OnPlayerDeployed(player: mod.Player) {
  if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
    return AIBehaviorHandler.OnAIPlayerSpawn(player);
  } else {
    return PlayerHandler.OnHumanPlayerSpawn(player);
  }
}

export async function OnVehicleSpawned(vehicle: mod.Vehicle) {
  console.log('Vehicle spawned, checking for nearby AI to enter vehicle');
  await AIBehaviorHandler.VehicleSpawned(vehicle);
}

export async function OnPlayerEnterVehicle(player: mod.Player, vehicle: mod.Vehicle) {
  const isBot = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
  const isAIAllowedToDriveThis = IsAIAllowedVehicle(vehicle);

  if (isBot && !isAIAllowedToDriveThis) {
    await mod.Wait(0.5);
    mod.ForcePlayerExitVehicle(player);
  }
}

// ======
// Logic
// ======

async function FastTick() {
  await mod.Wait(0.1);
}

async function SlowTick() {
  await mod.Wait(1);
  await TriggerWaveSpawns();
  SlowTick();
}

async function TriggerWaveSpawns() {
  const gameTime = mod.GetMatchTimeElapsed();

  for (const wave of WAVES) {
    if (gameTime >= wave.startsAt) {
      await SpawnWave(wave);

      // Remove the wave from the list to prevent re-spawning
      WAVES.splice(WAVES.indexOf(wave), 1);
    }
  }
}

async function SpawnWave(wave: Wave) {
  console.log(`Spawning wave ${wave.waveNumber} at ${wave.startsAt} seconds`);

  // Calculate total infantry count
  const totalInfantry = wave.infantryCounts
    ? wave.infantryCounts.reduce((sum, count) => sum + count, 0)
    : 0;

  // Calculate total vehicle count
  const totalVehicles = wave.vehicleCounts
    ? wave.vehicleCounts.reduce((sum, count) => sum + count, 0)
    : 0;

  // Update UI based on wave composition
  if (wave.infantryCounts && wave.vehicleCounts) {
    uiManager.UpdateWaveInfoMixed(wave.waveNumber, totalInfantry, totalVehicles);
  } else if (wave.infantryCounts) {
    uiManager.UpdateWaveInfoInfantry(wave.waveNumber, totalInfantry);
  }

  if (wave.spawnPoints && wave.infantryCounts) {
    for (const spawnPointId of wave.spawnPoints) {
      const index = wave.spawnPoints.indexOf(spawnPointId);
      const infantryPerSpawnPoint = wave.infantryCounts[index] || 0;

      const spawnPoint = mod.GetSpawner(spawnPointId);
      for (let i = 0; i < infantryPerSpawnPoint; i++) {
        AIBehaviorHandler.SpawnAI(spawnPoint);
        await mod.Wait(INTERSPAWN_DELAY);
      }
    }

    const players = mod.AllPlayers();
    const n = mod.CountOf(players);

    for (let i = 0; i < n; i++) {
      const loopPlayer = mod.ValueInArray(players, i);

      if (mod.IsPlayerValid(loopPlayer) && mod.GetSoldierState(loopPlayer, mod.SoldierStateBool.IsAISoldier)) {
        mod.AIBattlefieldBehavior(loopPlayer);
      }
    }
  }

  if (wave.vehicleCounts && wave.vehicleSpawnPoints && wave.vehicleTypes) {
    for (const spawnPointId of wave.vehicleSpawnPoints) {
      const index = wave.vehicleSpawnPoints.indexOf(spawnPointId);
      const vehiclesPerSpawnPoint = wave.vehicleCounts[index] || 0;

      const spawnPoint = mod.GetVehicleSpawner(spawnPointId);

      for (let i = 0; i < vehiclesPerSpawnPoint; i++) {
        const vehicleType = wave.vehicleTypes[i % wave.vehicleTypes.length];
        mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
        mod.SetVehicleSpawnerAutoSpawn(spawnPoint, true);
        mod.ForceVehicleSpawnerSpawn(spawnPoint);
        await mod.Wait(INTERSPAWN_DELAY);
      }
    }
  }
}

// ===== interfaces\Wave.ts =====
interface Wave {
  waveNumber: number; // The wave number (for display purposes)
  startsAt: number; // in seconds
  spawnPoints?: number[]; // AI spawn point IDs
  infantryCounts?: number[]; // Number of infantry to spawn per spawn point
  vehicleCounts?: number[]; // Number of vehicles to spawn per vehicle spawn point
  vehicleTypes?: mod.VehicleList[]; // Types of vehicles to spawn
  vehicleSpawnPoints?: number[]; // Vehicle spawn point IDs
}

// ===== UI\UIManager.ts =====
class UIManager {
  waveInfoWidgetContainer: mod.UIWidget;
  waveInfoWidgetwaveNumber: mod.UIWidget;
  waveInfoWidgetWaveDetails: mod.UIWidget;

  constructor() {
    modlib.ParseUI(WaveInfoWidgetDefinition);
    this.waveInfoWidgetContainer = mod.FindUIWidgetWithName('Container_WaveInfo');
    this.waveInfoWidgetwaveNumber = mod.FindUIWidgetWithName('Text_WaveInfo_waveNumber');
    this.waveInfoWidgetWaveDetails = mod.FindUIWidgetWithName('Text_WaveInfo_WaveDetails');
  }

  UpdateWaveInfoInfantry(waveNumber: number, infantryCount: number) {
    mod.SetUITextLabel(this.waveInfoWidgetwaveNumber, mod.Message(mod.stringkeys.waveNumber, waveNumber));
    mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.waveDetailsInfantry, infantryCount));
  }

  UpdateWaveInfoMixed(waveNumber: number, infantryCount: number, vehicleCount: number) {
    mod.SetUITextLabel(this.waveInfoWidgetwaveNumber, mod.Message(mod.stringkeys.waveNumber, waveNumber));
    mod.SetUITextLabel(this.waveInfoWidgetWaveDetails, mod.Message(mod.stringkeys.waveDetailsVehicles, infantryCount, vehicleCount));
  }
}

// ===== UI\WaveInfoWidget.ts =====
const WaveInfoWidgetDefinition = {
  name: "Container_WaveInfo",
  type: "Container",
  position: [25, 25],
  size: [400, 104],
  anchor: mod.UIAnchor.TopLeft,
  visible: true,
  padding: 5,
  bgColor: [0.2118, 0.2235, 0.2353],
  bgAlpha: 0.2,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_WaveInfo_waveNumber",
      type: "Text",
      position: [15, 10],
      size: [150, 50],
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
      position: [15, 50],
      size: [390, 35],
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
    }
  ]
};