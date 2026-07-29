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
  capStateWidgetBar: mod.UIWidget;
  capStateWidgetStatus: mod.UIWidget;

  endOfWaveWidgetContainer: mod.UIWidget;
  endOfWaveWidgetSubtitle: mod.UIWidget;

  difficultySelectWidgetContainer: mod.UIWidget;
  difficultySelectEasyButton: mod.UIWidget;
  difficultySelectMediumButton: mod.UIWidget;
  difficultySelectHardButton: mod.UIWidget;

  // Bumped per announcement so a stale auto-hide can't close a newer banner.
  private endOfWaveAnnouncementId = 0;

  // Flips every tick while the point is in danger, driving the status-line flash.
  private capStateFlashOn = false;

  // Which team the capture bar last belonged to - see UpdateCapStateWidget. Only read
  // while the point sits neutral with nobody capturing, where neither the owner nor the
  // capturing team can say which way the bar is about to move.
  private capStateNatoSide = true;

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
    this.capStateWidgetBar = mod.FindUIWidgetWithName('Box_CapState_ForeGround');
    this.capStateWidgetStatus = mod.FindUIWidgetWithName('Text_CapState_Status');
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

  /**
   * Renders the capture bar. The point runs on a single 0..1 progress value that belongs
   * to whichever team is currently claiming it: NATO's hold drains 1 -> 0, the point is
   * neutral at 0, then PAX's claim climbs 0 -> 1 and the match is lost when it tops out.
   * So progress means nothing on its own - it only reads correctly against the team it
   * belongs to, which is why both teams are passed in.
   */
  UpdateCapStateWidget(owner: mod.Team | null, capturingTeam: mod.Team | null, progress: number) {
    this.ShowCapStateWidget();

    const barWidth = 300;
    const barHeight = 25;
    const criticalThreshold = 0.4;

    const claim = Math.max(0, Math.min(1, progress));
    const percent = Math.round(claim * 100);

    // The owner is authoritative, but at exactly neutral nobody owns the point - then the
    // team actively capturing tells us which way the bar is moving, and if nobody is on
    // the point at all the previous side is the best guess left.
    const ownerId = owner ? mod.GetObjId(owner) : 0;
    const capturingId = capturingTeam ? mod.GetObjId(capturingTeam) : 0;

    let natoSide: boolean;
    if (ownerId === TEAMS.NATO || ownerId === TEAMS.PAX_ARMATA) {
      natoSide = ownerId === TEAMS.NATO;
    } else if (capturingId === TEAMS.NATO || capturingId === TEAMS.PAX_ARMATA) {
      natoSide = capturingId === TEAMS.NATO;
    } else {
      natoSide = this.capStateNatoSide;
    }
    this.capStateNatoSide = natoSide;

    // The bar and the status line share a colour so the state reads at a glance:
    // NATO cyan while the point is safe, amber once PAX start eating into it, red when
    // it is close to flipping.
    let stateColor: mod.Vector;
    let statusLabel: mod.Message;

    if (!natoSide) {
      // Past neutral the bar switches meaning - it now fills with PAX's claim, so the
      // percentage counts up towards defeat and back down again as the point is retaken.
      stateColor = mod.CreateVector(1, 0.5137, 0.3804);
      statusLabel = mod.Message(mod.stringkeys.capStateOverrun, percent);
    } else if (claim >= 1) {
      stateColor = mod.CreateVector(0.4392, 0.9216, 1);
      statusLabel = mod.Message(mod.stringkeys.capStateSecure, percent);
    } else if (claim >= criticalThreshold) {
      stateColor = mod.CreateVector(1, 0.7843, 0.3373);
      statusLabel = mod.Message(mod.stringkeys.capStateContested, percent);
    } else {
      stateColor = mod.CreateVector(1, 0.3373, 0.2941);
      statusLabel = mod.Message(mod.stringkeys.capStateCritical, percent);
    }

    mod.SetUIWidgetBgAlpha(this.capStateWidgetBar, 1);
    mod.SetUIWidgetBgColor(this.capStateWidgetBar, stateColor);
    mod.SetUIWidgetSize(this.capStateWidgetBar, mod.CreateVector(Math.round(barWidth * claim), barHeight, 0));

    mod.SetUITextLabel(this.capStateWidgetStatus, statusLabel);
    mod.SetUITextColor(this.capStateWidgetStatus, stateColor);

    // This only updates once a second, so an alpha flip between ticks is the only
    // animation available - use it to make a near-lost point demand attention.
    const shouldFlash = !natoSide || claim < criticalThreshold;
    this.capStateFlashOn = shouldFlash ? !this.capStateFlashOn : false;
    mod.SetUITextAlpha(this.capStateWidgetStatus, this.capStateFlashOn ? 0.35 : 1);
  }

  OnPlayerDeath(player: mod.Player) {
    this.HideIntroWidget();
  }
}
