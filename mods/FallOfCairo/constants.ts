// ID Ranges
// Core logic: 0-99
// Capture Points: 100-199
// Sectors: 200-299
// AI Spawn Points: 300-399
// Vehicle Spawn Points: 400-499
// Weapon emplacements: 500-599
// Area Triggers: 600-699

import { Wave } from './interfaces/Wave';

export const VERSION = '0.1.5';

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

export const INTERSPAWN_DELAY = 2;
