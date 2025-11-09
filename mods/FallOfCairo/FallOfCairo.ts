// Notes:
// Emplacements spawn TOWS instead of MG's, set type in script
// Bots immediately go to battlefield behavior instead of moving to point first
// Vehicles dont spawn

// TODO:
// Spawn points for bots
// Spawn points for vehicles
// Upgrades for players?
// Bot pathing
// Wave logic
// Difficulties?

// ID Ranges
// Core logic: 0-99
// Capture Points: 100-199
// Sectors: 200-299
// AI Spawn Points: 300-399
//   Main street: 300
//   Mosque: 301
// Vehicle Spawn Points: 400-499
// Weapon emplacements: 500-599
// Area Triggers: 600-699

interface Wave {
  startsAt: number; // in seconds
  spawnPoints?: number[]; // AI spawn point IDs
  infantryCount?: number; // Total number of infantry to spawn for this wave
  vehicleCount?: number; // Total number of vehicles to spawn for this wave
  vehicleTypes?: mod.VehicleList[]; // Types of vehicles to spawn
  vehicleSpawnPoints?: number[]; // Vehicle spawn point IDs
}

const VERSION = '0.1.3';

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
    startsAt: 30,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET],
    infantryCount: 1,
  },
  {
    startsAt: 60,
    spawnPoints: [AI_SPAWN_POINTS.MOSQUE],
    infantryCount: 6,
    vehicleTypes: [mod.VehicleList.M2Bradley],
    vehicleCount: 1,
    vehicleSpawnPoints: [VEHICLE_SPAWN_POINTS.MOSQUE],
  }
]

const INTERSPAWN_DELAY = 2;

// ======
// Events
// ======

// Initialize capture point settings when game starts
export async function OnGameModeStarted(): Promise<void> {
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing`);
  mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.announcementTitle, VERSION));

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const teamNato = mod.GetTeam(TEAMS.NATO);

  mod.EnableGameModeObjective(capturePoint, true);

  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);

  mod.DeployAllPlayers();

  SetupScoreboard();
  SetupEmplacements();
  await mod.Wait(10);

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
    console.log('AI Player deployed, setting up behavior');
    AIBehaviorHandler.OnAIPlayerSpawn(player);
    return;
  }
}

export async function OnVehicleSpawned(vehicle: mod.Vehicle) {
  console.log('Vehicle spawned, checking for nearby AI to enter vehicle');
  await AIBehaviorHandler.VehicleSpawned(vehicle);
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
  console.log(`Spawning wave at ${wave.startsAt} seconds`);

  if (wave.infantryCount && wave.spawnPoints) {
    const infantryPerSpawnPoint = Math.floor(wave.infantryCount / wave.spawnPoints.length);

    for (const spawnPointId of wave.spawnPoints) {
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

  if (wave.vehicleCount && wave.vehicleSpawnPoints && wave.vehicleTypes) {
    const vehiclesPerSpawnPoint = Math.floor(wave.vehicleCount / wave.vehicleSpawnPoints.length);

    for (const spawnPointId of wave.vehicleSpawnPoints) {
      const spawnPoint = mod.GetVehicleSpawner(spawnPointId);

      for (let i = 0; i < vehiclesPerSpawnPoint; i++) {
        const vehicleType = wave.vehicleTypes[i % wave.vehicleTypes.length];
        mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
        mod.ForceVehicleSpawnerSpawn(spawnPoint);
        await mod.Wait(2); // Small delay between spawns
      }
    }
  }
}

// TODO: Flesh this out
function SetupScoreboard(): void {
  console.log('Setting up scoreboard');
  mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
  mod.SetScoreboardHeader(mod.Message(mod.stringkeys.teamNameNato), mod.Message(mod.stringkeys.teamNamePax));
}

function SetupEmplacements() {
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

interface AIProfile {
  player: mod.Player
  team: mod.Team,
  currentTargetPosition?: mod.Vector,
}

class AIBehaviorHandler {
  static maxAmountOfAi = 32;
  static AiPlayers: AIProfile[] = [];
  static MaxRadius = 50;
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
    const ranks = [
      mod.stringkeys.rankPrivate,
      mod.stringkeys.rankCorporal,
      mod.stringkeys.rankSergeant,
      mod.stringkeys.rankLieutenant,
      mod.stringkeys.rankCaptain,
      mod.stringkeys.rankMajor,
      mod.stringkeys.rankColonel,
    ];

    const names = [
      mod.stringkeys.name0,  mod.stringkeys.name1,  mod.stringkeys.name2,  mod.stringkeys.name3,  mod.stringkeys.name4,
      mod.stringkeys.name5,  mod.stringkeys.name6,  mod.stringkeys.name7,  mod.stringkeys.name8,  mod.stringkeys.name9,
      mod.stringkeys.name10, mod.stringkeys.name11, mod.stringkeys.name12, mod.stringkeys.name13, mod.stringkeys.name14,
      mod.stringkeys.name15, mod.stringkeys.name16, mod.stringkeys.name17, mod.stringkeys.name18, mod.stringkeys.name19,
      mod.stringkeys.name20, mod.stringkeys.name21, mod.stringkeys.name22, mod.stringkeys.name23, mod.stringkeys.name24,
      mod.stringkeys.name25, mod.stringkeys.name26, mod.stringkeys.name27, mod.stringkeys.name28, mod.stringkeys.name29,
      mod.stringkeys.name30, mod.stringkeys.name31, mod.stringkeys.name32, mod.stringkeys.name33, mod.stringkeys.name34,
      mod.stringkeys.name35, mod.stringkeys.name36, mod.stringkeys.name37, mod.stringkeys.name38, mod.stringkeys.name39,
      mod.stringkeys.name40, mod.stringkeys.name41, mod.stringkeys.name42, mod.stringkeys.name43, mod.stringkeys.name44,
    ];

    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const name = names[Math.floor(Math.random() * names.length)];

    return mod.Message(mod.stringkeys.botName, rank, name);
  }

  static async SpawnAI(spawnPoint: mod.Spawner): Promise<void> {
    if (AIBehaviorHandler.AiPlayers.length >= AIBehaviorHandler.maxAmountOfAi) {
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

    AIBehaviorHandler.AiPlayers.push(newAIProfile)
    AIBehaviorHandler.DirectAiToAttackPoint(newAIProfile, targetPos)
  }

  static GetAllAIPlayers() {
    let AiPlayers: mod.Player[] = []

    AIBehaviorHandler.AiPlayers.forEach(element => {
      AiPlayers.push(element.player)
    });

    return AiPlayers
  }

  static OnAIPlayerDied(player: mod.Player) {
    const index = AIBehaviorHandler.AiPlayers.findIndex(x => IsObjectIDsEqual(x.player, player));

    if (index !== -1) {
      AIBehaviorHandler.AiPlayers.splice(index, 1);
    }
  }

  static async VehicleSpawned(vehicle: mod.Vehicle) {
    const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const targetPos = mod.GetObjectPosition(mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT));
    const aiPlayers = AIBehaviorHandler.AiPlayers;

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

  static async DirectAiToAttackPoint(aIProfile: AIProfile, targetPosition: mod.Vector) {
    aIProfile.currentTargetPosition = targetPosition;

    mod.AISetMoveSpeed(aIProfile.player, mod.MoveSpeed.InvestigateRun);

    while (mod.GetSoldierState(aIProfile.player, mod.SoldierStateBool.IsAlive)) {
      console.log(`Directing AI ${mod.GetObjId(aIProfile.player)} towards target point`);
      const playerPosition = mod.GetSoldierState(aIProfile.player, mod.SoldierStateVector.GetPosition);
      const _targetPosition = AIBehaviorHandler.AIHelpMoveTowardsPoint(playerPosition, targetPosition);

      mod.AIMoveToBehavior(aIProfile.player, _targetPosition);

      if (mod.DistanceBetween(playerPosition, _targetPosition) < AIBehaviorHandler.MaxRadius) {
        console.log(`AI ${mod.GetObjId(aIProfile.player)} reached target point, switching to battlefield behavior`);
        mod.AIBattlefieldBehavior(aIProfile.player);

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

// Helpers
function IsObjectIDsEqual(left: any, right: any) {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}
