import { IntroWidgetDefinition } from './IntroWidget';
import { WaveInfoWidgetDefinition } from './WaveInfoWidget';
import { VictoryWidgetDefinition } from './VictoryWidget';
import { DefeatWidgetDefinition } from './DefeatWidget';
import { CapStateWidgetDefinition } from './CapStateWidget';
import { TEAMS } from '../../constants';

export class UIManager {
  waveInfoWidgetContainer: mod.UIWidget;
  waveInfoWidgetWaveNumber: mod.UIWidget;
  waveInfoWidgetWaveDetails: mod.UIWidget;
  waveInfoWidgetWaveTime: mod.UIWidget;

  introWidgetContainer: mod.UIWidget;
  victoryWidgetContainer: mod.UIWidget;
  defeatWidgetContainer: mod.UIWidget;
  capStateWidgetContainer: mod.UIWidget;

  constructor() {
    (function parseWaveInfoWidgetDefinition() { modlib.ParseUI(WaveInfoWidgetDefinition) })();
    (function parseIntroWidgetDefinition()    { modlib.ParseUI(IntroWidgetDefinition)    })();
    (function parseVictoryWidgetDefinition()  { modlib.ParseUI(VictoryWidgetDefinition)  })();
    (function parseDefeatWidgetDefinition()   { modlib.ParseUI(DefeatWidgetDefinition)   })();
    (function parseCapStateWidgetDefinition() { modlib.ParseUI(CapStateWidgetDefinition) })();

    this.waveInfoWidgetContainer = mod.FindUIWidgetWithName('Container_WaveInfo');
    this.waveInfoWidgetWaveNumber = mod.FindUIWidgetWithName('Text_WaveInfo_WaveNumber');
    this.waveInfoWidgetWaveDetails = mod.FindUIWidgetWithName('Text_WaveInfo_WaveDetails');
    this.waveInfoWidgetWaveTime = mod.FindUIWidgetWithName('Text_WaveInfo_WaveTime');
    this.introWidgetContainer = mod.FindUIWidgetWithName('Container_Intro');
    this.victoryWidgetContainer = mod.FindUIWidgetWithName('Container_Victory');
    this.defeatWidgetContainer = mod.FindUIWidgetWithName('Container_Defeat');
    this.capStateWidgetContainer = mod.FindUIWidgetWithName('Container_CapState');

    mod.SetUIWidgetBgFill(this.waveInfoWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.introWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.victoryWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.defeatWidgetContainer, mod.UIBgFill.Blur);

    mod.SetUIWidgetVisible(this.waveInfoWidgetContainer, false);
    mod.SetUIWidgetVisible(this.introWidgetContainer, false);
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
    mod.SetUIWidgetVisible(this.defeatWidgetContainer, false);
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, false);
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

  ShowCapStateWidget() {
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, true);
  }

  HideCapStateWidget() {
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, false);
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

    const progressBarContainer = mod.FindUIWidgetWithName('Box_CapState_ForeGround');
    const barWidth = 300;

    // GetCaptureProgress returns 0..1, and reads 0 while the point sits uncontested,
    // so show a full bar for the owning team and let a contest eat into it.
    const fill = progress > 0 ? Math.min(progress, 1) : 1;

    mod.SetUIWidgetBgAlpha(progressBarContainer, 1);

    const ownerIsNato = mod.GetObjId(owner) === mod.GetObjId(mod.GetTeam(TEAMS.NATO));
    const bgColor: mod.Vector = ownerIsNato ? mod.CreateVector(0.4392, 0.9216, 1) : mod.CreateVector(1, 0.5137, 0.3804);

    mod.SetUIWidgetBgColor(progressBarContainer, bgColor);
    mod.SetUIWidgetSize(progressBarContainer, mod.CreateVector(Math.round(barWidth * fill), 50, 0))
  }

  OnPlayerDeath(player: mod.Player) {
    this.HideIntroWidget();
  }
}
