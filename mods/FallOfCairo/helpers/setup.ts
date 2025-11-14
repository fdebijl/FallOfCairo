import { DifficultyManager } from '../classes/DifficultyManager';
import { Difficulty } from '../combined';
import { WEAPON_EMPLACEMENTS } from '../constants';
import { UIManager } from '../UI/UIManager';
import { freezePlayers, unfreezePlayers } from './helpers';

/** Run all one-time setup methods */
export async function Setup(uiManager: UIManager): Promise<void> {
  SetupScoreboard();
  SetupEmplacements();

  DifficultyManager.applyDifficultySettings(Difficulty.Medium);

  freezePlayers();
  uiManager.ShowIntroWidget();
  await mod.Wait(14);
  uiManager.HideIntroWidget();
  unfreezePlayers();
  uiManager.ShowWaveInfoWidget();
}

// TODO: Flesh this out:
// - Can we hide PAX?
// - Set column names
// - Set scores somewhere
function SetupScoreboard(): void {
  console.log('Setting up scoreboard');
  mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
  mod.SetScoreboardHeader(mod.Message(mod.stringkeys.teamNameNato), mod.Message(mod.stringkeys.teamNamePax));
  mod.SetScoreboardColumnNames(
    mod.Message(mod.stringkeys.scoreboardKills),
    mod.Message(mod.stringkeys.scoreboardDeaths),
    mod.Message(mod.stringkeys.scoreboardScore
  )
}

function SetupEmplacements() {
  // EmplacementSpawners only spawn TOW's at the moment, this is a known bug
  return;

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

