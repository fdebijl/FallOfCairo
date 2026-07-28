import { IntroWidgetDefinition } from './IntroWidget';
import { WaveInfoWidgetDefinition } from './WaveInfoWidget';
import { VictoryWidgetDefinition } from './VictoryWidget';
import { DefeatWidgetDefinition } from './DefeatWidget';
import { CapStateWidgetDefinition } from './CapStateWidget';
import { EndOfWaveWidgetDefinition } from './EndOfWaveWidget';
import { DifficultySelectWidgetDefinition } from './DifficultySelectWidget';
import { TEAMS } from '../../constants';
import { Difficulty } from '../Difficulty';

export class UIManager {
  waveInfoWidgetContainer: mod.UIWidget;
  waveInfoWidgetWaveNumber: mod.UIWidget;
  waveInfoWidgetWaveDetails: mod.UIWidget;
  waveInfoWidgetWaveTime: mod.UIWidget;

  introWidgetContainer: mod.UIWidget;
  victoryWidgetContainer: mod.UIWidget;
  defeatWidgetContainer: mod.UIWidget;
  capStateWidgetContainer: mod.UIWidget;

  endOfWaveWidgetContainer: mod.UIWidget;
  endOfWaveWidgetSubtitle: mod.UIWidget;

  difficultySelectWidgetContainer: mod.UIWidget;
  difficultySelectEasyButton: mod.UIWidget;
  difficultySelectMediumButton: mod.UIWidget;
  difficultySelectHardButton: mod.UIWidget;

  // Bumped per announcement so a stale auto-hide can't close a newer banner.
  private endOfWaveAnnouncementId = 0;

  constructor() {
    (function parseWaveInfoWidgetDefinition() { modlib.ParseUI(WaveInfoWidgetDefinition) })();
    (function parseIntroWidgetDefinition()    { modlib.ParseUI(IntroWidgetDefinition)    })();
    (function parseVictoryWidgetDefinition()  { modlib.ParseUI(VictoryWidgetDefinition)  })();
    (function parseDefeatWidgetDefinition()   { modlib.ParseUI(DefeatWidgetDefinition)   })();
    (function parseCapStateWidgetDefinition() { modlib.ParseUI(CapStateWidgetDefinition) })();
    (function parseEndOfWaveWidgetDefinition(){ modlib.ParseUI(EndOfWaveWidgetDefinition) })();
    (function parseDifficultySelectWidgetDefinition(){ modlib.ParseUI(DifficultySelectWidgetDefinition) })();

    this.waveInfoWidgetContainer = mod.FindUIWidgetWithName('Container_WaveInfo');
    this.waveInfoWidgetWaveNumber = mod.FindUIWidgetWithName('Text_WaveInfo_WaveNumber');
    this.waveInfoWidgetWaveDetails = mod.FindUIWidgetWithName('Text_WaveInfo_WaveDetails');
    this.waveInfoWidgetWaveTime = mod.FindUIWidgetWithName('Text_WaveInfo_WaveTime');
    this.introWidgetContainer = mod.FindUIWidgetWithName('Container_Intro');
    this.victoryWidgetContainer = mod.FindUIWidgetWithName('Container_Victory');
    this.defeatWidgetContainer = mod.FindUIWidgetWithName('Container_Defeat');
    this.capStateWidgetContainer = mod.FindUIWidgetWithName('Container_CapState');
    this.endOfWaveWidgetContainer = mod.FindUIWidgetWithName('Container_EndOfWave');
    this.endOfWaveWidgetSubtitle = mod.FindUIWidgetWithName('Text_EndOfWave_Subtitle');
    this.difficultySelectWidgetContainer = mod.FindUIWidgetWithName('Container_DifficultyMenu');
    this.difficultySelectEasyButton = mod.FindUIWidgetWithName('Button_DifficultyEasy');
    this.difficultySelectMediumButton = mod.FindUIWidgetWithName('Button_DifficultyMedium');
    this.difficultySelectHardButton = mod.FindUIWidgetWithName('Button_DifficultyHard');

    mod.SetUIWidgetBgFill(this.waveInfoWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.introWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.victoryWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.defeatWidgetContainer, mod.UIBgFill.Blur);
    mod.SetUIWidgetBgFill(this.endOfWaveWidgetContainer, mod.UIBgFill.Blur);

    mod.SetUIWidgetVisible(this.waveInfoWidgetContainer, false);
    mod.SetUIWidgetVisible(this.introWidgetContainer, false);
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
    mod.SetUIWidgetVisible(this.defeatWidgetContainer, false);
    mod.SetUIWidgetVisible(this.capStateWidgetContainer, false);
    mod.SetUIWidgetVisible(this.endOfWaveWidgetContainer, false);
    mod.SetUIWidgetVisible(this.difficultySelectWidgetContainer, false);

    // Buttons stay silent until their event is explicitly enabled - without this,
    // OnPlayerUIButtonEvent never fires for them.
    mod.EnableUIButtonEvent(this.difficultySelectEasyButton, mod.UIButtonEvent.ButtonUp, true);
    mod.EnableUIButtonEvent(this.difficultySelectMediumButton, mod.UIButtonEvent.ButtonUp, true);
    mod.EnableUIButtonEvent(this.difficultySelectHardButton, mod.UIButtonEvent.ButtonUp, true);
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
    this.HideEndOfWaveWidget();
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, true);
  }

  HideVictoryWidget() {
    mod.SetUIWidgetVisible(this.victoryWidgetContainer, false);
  }

  ShowDefeatWidget() {
    this.HideEndOfWaveWidget();
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

  ShowEndOfWaveWidget() {
    mod.SetUIWidgetVisible(this.endOfWaveWidgetContainer, true);
  }

  HideEndOfWaveWidget() {
    mod.SetUIWidgetVisible(this.endOfWaveWidgetContainer, false);
  }

  /**
   * Widgets are global, so everyone sees the menu, but only the chooser gets the cursor
   * that can actually click it - the difficulty is a one-time, match-wide decision.
   */
  ShowDifficultySelectWidget(chooser: mod.Player) {
    mod.SetUIWidgetVisible(this.difficultySelectWidgetContainer, true);
    mod.EnableUIInputMode(true, chooser);
  }

  HideDifficultySelectWidget(chooser: mod.Player) {
    mod.SetUIWidgetVisible(this.difficultySelectWidgetContainer, false);

    // Leaving input mode on would keep the chooser stuck in cursor mode with no UI to
    // click, so this has to run even if they left the match in the meantime.
    if (mod.IsPlayerValid(chooser)) {
      mod.EnableUIInputMode(false, chooser);
    }
  }

  /**
   * Maps a pressed widget onto the difficulty it selects, or null if the press came from
   * some other button entirely.
   */
  GetDifficultyForButton(widget: mod.UIWidget): Difficulty | null {
    switch (mod.GetUIWidgetName(widget)) {
      case 'Button_DifficultyEasy':
        return Difficulty.Easy;
      case 'Button_DifficultyMedium':
        return Difficulty.Medium;
      case 'Button_DifficultyHard':
        return Difficulty.Hard;
      default:
        return null;
    }
  }

  /**
   * Flashes the WAVE CLEARED banner for durationSeconds, then hides it again.
   * Deliberately not awaited by callers - it sleeps for the whole display duration.
   */
  async AnnounceWaveCleared(waveNumber: number, durationSeconds: number) {
    this.endOfWaveAnnouncementId++;
    const announcementId = this.endOfWaveAnnouncementId;

    mod.SetUITextLabel(this.endOfWaveWidgetSubtitle, mod.Message(mod.stringkeys.endOfWaveSubtitle, waveNumber));
    this.ShowEndOfWaveWidget();

    await mod.Wait(durationSeconds);

    // Something newer (another wave clear, victory, defeat) may own the banner by
    // now - only the most recent announcement gets to take it down.
    if (announcementId === this.endOfWaveAnnouncementId) {
      this.HideEndOfWaveWidget();
    }
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
    const width = Math.round(barWidth * fill);
    const height = 25;
    mod.SetUIWidgetSize(progressBarContainer, mod.CreateVector(width, height, 0))
  }

  OnPlayerDeath(player: mod.Player) {
    this.HideIntroWidget();
  }
}
