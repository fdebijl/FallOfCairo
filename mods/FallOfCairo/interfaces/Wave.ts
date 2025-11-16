export interface Wave {
  waveNumber: number; // The wave number (for display purposes)
  spawnPoints?: number[]; // AI spawn point IDs
  infantryCounts?: number[]; // Number of infantry to spawn per spawn point
  vehicleCounts?: number[]; // Number of vehicles to spawn per vehicle spawn point
  vehicleTypes?: mod.VehicleList[]; // Types of vehicles to spawn
  vehicleSpawnPoints?: number[]; // Vehicle spawn point IDs
}
