import { DifficultyManager } from '../classes/DifficultyManager';
import { Difficulty } from '../combined';
import { WEAPON_EMPLACEMENTS } from '../constants';
import { UIManager } from '../interfaces/UI/UIManager';
import { freezePlayers, unfreezePlayers } from './helpers';

/** Run all one-time setup methods */
export async function Setup(uiManager: UIManager): Promise<void> {
  SetupScoreboard();
  SetupEmplacements();

  DifficultyManager.applyDifficultySettings(Difficulty.Medium);

  uiManager.ShowIntroWidget();
  await mod.Wait(10);
  uiManager.HideIntroWidget();
  uiManager.ShowWaveInfoWidget();

  // TODO: This is not adding too much right now, let's work on a proper loot system later
  // const lootSpawner1 = mod.GetLootSpawner(700);
  // mod.SpawnLoot(lootSpawner1, mod.Gadgets.CallIn_UAV_Overwatch);
  // const lootSpawner2 = mod.GetLootSpawner(701);
  // mod.SpawnLoot(lootSpawner2, mod.Gadgets.CallIn_Air_Strike);
  // const lootSpawner3 = mod.GetLootSpawner(702);
  // mod.SpawnLoot(lootSpawner3, mod.Gadgets.CallIn_Ammo_Drop);
}


function SetupScoreboard(): void {
  mod.SetScoreboardType(mod.ScoreboardType.NotSet);
  return;

  // TODO: Flesh this out:
  // - Can we hide PAX?
  // - Set column names
  // - Set scores somewhere
  // - Set number of columns to just three?
  console.log('Setting up scoreboard');
  mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
  mod.SetScoreboardHeader(mod.Message(mod.stringkeys.teamNameNato), mod.Message(mod.stringkeys.teamNamePax));
  mod.SetScoreboardColumnNames(
    mod.Message(mod.stringkeys.scoreboardKills),
    mod.Message(mod.stringkeys.scoreboardDeaths),
    mod.Message(mod.stringkeys.scoreboardScore)
  )
}

function SetupEmplacements() {
  // TODO: EmplacementSpawners only spawn TOW's at the moment, this is a known bug
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

