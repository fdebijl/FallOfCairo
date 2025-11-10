import { WaveInfoWidgetDefinition } from './WaveInfoWidget';

export class UIManager {
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
