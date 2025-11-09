// TODO:
// Spawn points for bots
// Spawn points for vehicles
// Upgrades for players?
// Bot pathing
// Wave logic
// Difficulties?

const VERSION = '0.0.9';

const CAPTURE_POINTS = {
  HUMAN_CAPTURE_POINT: 100,
}

const TEAMS = {
  NATO: 1,
  PAX_ARMATA: 2,
}

// Initialize capture point settings when game starts
export async function OnGameModeStarted(): Promise<void> {  
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing...`);
  mod.DisplayNotificationMessage(mod.Message(`Fall of Cairo v${VERSION}`));

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  console.log('Using capture point:');
  console.log(capturePoint);
  const teamNato = mod.GetTeam(TEAMS.NATO); // Team 1 (NATO - Human players)

  // Enable the capture point objective
  console.log('Enabling capture point objective...');
  mod.EnableGameModeObjective(capturePoint, true);

  // Set capture time to 120 seconds
  console.log('Setting capture point times...');
  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 5);

  // Set initial owner to Team 1 (humans)
  console.log('Setting capture point owner to Team 1 (NATO)...');
  mod.SetCapturePointOwner(capturePoint, teamNato);

  mod.DeployAllPlayers();

  // Disable deploying on the capture point
  // mod.EnableCapturePointDeploying(capturePoint, false);

  await mod.Wait(10);
  mod.DisplayNotificationMessage(mod.Message(`Fall of Cairo v${VERSION}`));
}

// TODO: This doesn't work I think, let's try on capture point lost and check the logic here.
export function OnCapturePointCaptured(capturePoint: mod.CapturePoint): void {
  const capturePointId = mod.GetObjId(capturePoint);
  const controllingTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint));

  if (capturePointId === CAPTURE_POINTS.HUMAN_CAPTURE_POINT) {
    console.log('Capture point is the human capture point.');
    const teamPax = mod.GetTeam(TEAMS.PAX_ARMATA); // Team 2 (PAX Armata - AI bots)

    console.log('Owners:');
    console.log(controllingTeamId);

    // If Team 2 captured the point, humans lose
    if (controllingTeamId === TEAMS.PAX_ARMATA) {
      console.log('Team 2 captured the point, ending game mode with defeat for humans.');
      mod.DisplayNotificationMessage(mod.Message('You lost lmao'));
      mod.EndGameMode(teamPax);
    }
  }
}
