// ID Ranges
// Core logic: 0-99
// Capture Points: 100-199
// Sectors: 200-299
// AI Spawn Points: 300-399
// Vehicle Spawn Points: 400-499
// Weapon emplacements: 500-599
// Area Triggers: 600-699
// Loot spawners: 700-799

import { Wave } from './interfaces/Wave';

export const VERSION = '1.1.0';

export const INTERMISSION_DURATION_SECONDS = 30;
export const FIRST_WAVE_START_TIME = 60;

export const CAPTURE_POINTS = {
  HUMAN_CAPTURE_POINT: 100,
}

export const SECTORS = {
  HUMAN_SECTOR: 200,
  AI_SECTOR: 201
}

export const TEAMS = {
  NATO: 1,
  PAX_ARMATA: 2,
}

export const AI_SPAWN_POINTS = {
  MAIN_STREET: 300,
  MOSQUE: 301,
  FLANK_RIGHT: 302,
  FLANK_LEFT: 303,
  PLAZA: 304,
  NATO: 399
};

export const VEHICLE_SPAWN_POINTS = {
  MAIN_STREET: 400,
  MOSQUE: 401,
  FLANK_RIGHT: 402,
  FLANK_LEFT: 403
};

export const WEAPON_EMPLACEMENTS: {
  [key: string]: {
    id: number;
    type: mod.StationaryEmplacements;
  }
} = {
  PLAZA_MG_NORTH: { id: 500, type: mod.StationaryEmplacements.M2MG },
  PLAZA_MG_SOUTH: { id: 501, type: mod.StationaryEmplacements.M2MG },
};

export const WAVES: Wave[] = [
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

export const INTERSPAWN_DELAY = 1;
