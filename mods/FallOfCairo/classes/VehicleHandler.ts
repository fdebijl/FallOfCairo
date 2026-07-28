import { IsAIAllowedVehicle } from '../helpers/helpers';
import { BotHandler } from './BotHandler';
import { Vehicle } from './Vehicle';

export class VehicleHandler {
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
