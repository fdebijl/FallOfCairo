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

interface Wave {
  startsAt: number; // in seconds
  spawnPoints?: number[]; // AI spawn point IDs
  vehicleSpawnPoints?: number[]; // Vehicle spawn point IDs
  infantryCount?: number; // Total number of infantry to spawn for this wave
  vehicleCount?: number; // Total number of vehicles to spawn for this wave
  vehicleTypes?: mod.VehicleList[]; // Types of vehicles to spawn
}

const VERSION = '0.1.0';

const CAPTURE_POINTS = {
  HUMAN_CAPTURE_POINT: 100,
}

const TEAMS = {
  NATO: 1,
  PAX_ARMATA: 2,
}

const AI_SPAWN_POINTS = {
  MAIN_STREET: 300,
  MOSQUE: 301,
}

const WAVES = [
  {
    startsAt: 10,
    spawnPoints: [AI_SPAWN_POINTS.MAIN_STREET],
    infantryCount: 5,
  }
]

const INTERSPAWN_DELAY = 2;

// Initialize capture point settings when game starts
export async function OnGameModeStarted(): Promise<void> {  
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing...`);
  mod.DisplayNotificationMessage(mod.Message(`Fall of Cairo v${VERSION}`));

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const teamNato = mod.GetTeam(TEAMS.NATO); 

  mod.EnableGameModeObjective(capturePoint, true);

  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);

  mod.DeployAllPlayers();

  // Disable deploying on the capture point
  // mod.EnableCapturePointDeploying(capturePoint, false);

  await mod.Wait(10);
  mod.DisplayNotificationMessage(mod.Message(`Fall of Cairo v${VERSION}`));

  // FastTick();
  SlowTick();
}

export function OnCapturePointCaptured(capturePoint: mod.CapturePoint): void {
  const capturePointId = mod.GetObjId(capturePoint);
  const controllingTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint));

  if (capturePointId === CAPTURE_POINTS.HUMAN_CAPTURE_POINT && controllingTeamId === TEAMS.PAX_ARMATA) {
    const teamPax = mod.GetTeam(TEAMS.PAX_ARMATA);
    console.log('Team 2 captured the point, ending game mode with defeat for humans.');
    mod.DisplayNotificationMessage(mod.Message('You lost lmao'));
    mod.EndGameMode(teamPax);
  }
}

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
  const team = mod.GetTeam(TEAMS.PAX_ARMATA);
  
  if (wave.infantryCount && wave.spawnPoints) {
    const infantryPerSpawnPoint = Math.floor(wave.infantryCount / wave.spawnPoints.length);
    for (const spawnPointId of wave.spawnPoints) {
      const spawnPoint = mod.GetSpawner(spawnPointId);
      for (let i = 0; i < infantryPerSpawnPoint; i++) {
        mod.SpawnAIFromAISpawner(spawnPoint, GetSoldierClass(), mod.Message(GetSoldierName()), team);
        await mod.Wait(INTERSPAWN_DELAY);
      }
    }
  }

  // if (wave.vehicleCount && wave.vehicleSpawnPoints && wave.vehicleTypes) {
  //   const vehiclesPerSpawnPoint = Math.floor(wave.vehicleCount / wave.vehicleSpawnPoints.length);
  //   for (const spawnPointId of wave.vehicleSpawnPoints) {
  //     const spawnPoint = mod.GetVehicleSpawnPoint(spawnPointId);
  //     for (let i = 0; i < vehiclesPerSpawnPoint; i++) {
  //       const vehicleType = wave.vehicleTypes[i % wave.vehicleTypes.length];
  //       mod.SpawnVehicleAtSpawnPoint(spawnPoint, vehicleType, TEAMS.PAX_ARMATA);
  //       await mod.Wait(1); // Small delay between spawns
  //     }
  //   }
  // }
}

function GetSoldierClass() {
  const rand = Math.random();
  if (rand < 0.50) {
    return mod.SoldierClass.Assault;
  } else if (rand < 0.75) {
    return mod.SoldierClass.Support;
  } else if (rand < 0.90) {
    return mod.SoldierClass.Engineer;
  } else {
    return mod.SoldierClass.Recon;
  }
}

function GetSoldierName() {
  const ranks = ['Pvt.', 'Cpl.', 'Sgt.', 'Lt.', 'Capt.', 'Maj.', 'Col.'];

  const names = [
    'Musa', 'Annet', 'Silva', 'Svetozar', 'Ntombizodwa',
    'Mitrodora', 'Jan', 'Margarida',  'Dileep', 'Shelomit',
    'Chetan', 'Ábel', 'Gijs', 'Yara', 'Tariq',
    'Leila', 'Omar', 'Fatima', 'Khaled', 'Amina',
    'Hiroshi', 'Yuki', 'Sakura', 'Jin', 'Mei',
    'Liam', 'Emma', 'Noah', 'Olivia', 'Ava',
    'Ethan', 'Sophia', 'Mason', 'Isabella', 'Mia',
    'Kwame', 'Ayo', 'Zuri', 'Nia', 'Jabari',
    'Amara', 'Kofi', 'Imani', 'Taye', 'Sade',
  ];

  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return `${rank} ${name}`;
}