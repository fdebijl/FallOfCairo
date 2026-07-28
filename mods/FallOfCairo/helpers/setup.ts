import { DifficultyManager } from '../classes/DifficultyManager';
import { PlayerHandler } from '../classes/PlayerHandler';
import { DIFFICULTY_SELECT_DEADLINE_SECONDS, WEAPON_EMPLACEMENTS } from '../constants';
import { UIManager } from '../interfaces/UI/UIManager';
import { freezePlayers, unfreezePlayers } from './helpers';

/** Run all one-time setup methods */
export async function Setup(uiManager: UIManager): Promise<void> {
  SetupScoreboard();
  SetupEmplacements();

  // Applied up front so nothing reads an unset difficulty before a player picks one.
  DifficultyManager.applyDifficultySettings(DifficultyManager.defaultDifficulty);

  uiManager.ShowIntroWidget();
  await mod.Wait(10);
  uiManager.HideIntroWidget();
  uiManager.ShowWaveInfoWidget();

  await PromptForDifficulty(uiManager);

  // TODO: This is not adding too much right now, let's work on a proper loot system later
  // const lootSpawner1 = mod.GetLootSpawner(700);
  // mod.SpawnLoot(lootSpawner1, mod.Gadgets.CallIn_UAV_Overwatch);
  // const lootSpawner2 = mod.GetLootSpawner(701);
  // mod.SpawnLoot(lootSpawner2, mod.Gadgets.CallIn_Air_Strike);
  // const lootSpawner3 = mod.GetLootSpawner(702);
  // mod.SpawnLoot(lootSpawner3, mod.Gadgets.CallIn_Ammo_Drop);
}


/**
 * Puts the difficulty menu in front of the first human player who deployed and waits for
 * them to pick one. Falls back to the default difficulty if nobody is there to choose, or
 * if the chooser sits on it, so the match still starts on schedule either way.
 */
async function PromptForDifficulty(uiManager: UIManager): Promise<void> {
  while (!PlayerHandler.firstDeployedHumanPlayer && mod.GetMatchTimeElapsed() < DIFFICULTY_SELECT_DEADLINE_SECONDS) {
    await mod.Wait(1);
  }

  const chooser = PlayerHandler.firstDeployedHumanPlayer;

  if (chooser && mod.IsPlayerValid(chooser)) {
    uiManager.ShowDifficultySelectWidget(chooser);

    // OnPlayerUIButtonEvent is what flips hasBeenChosen.
    while (!DifficultyManager.hasBeenChosen && mod.GetMatchTimeElapsed() < DIFFICULTY_SELECT_DEADLINE_SECONDS) {
      console.log('has diff been chosen?', DifficultyManager.hasBeenChosen);
      await mod.Wait(1);
    }

    uiManager.HideDifficultySelectWidget(chooser);
  }

  if (!DifficultyManager.hasBeenChosen) {
    console.log('No difficulty was picked in time, keeping the default');
    DifficultyManager.chooseDifficulty(DifficultyManager.defaultDifficulty);
  }
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

