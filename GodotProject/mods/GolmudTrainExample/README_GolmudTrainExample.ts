/* 

The map Railway to Golmud features a train in some of the official game modes.

The example .TS file provided here shows examples of how to use the train in custom experiences.

*/

////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// HOW TO INSTANTIATE THE TRAIN ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
// The train that appears in your custom experiences can be determined through a setting
// from the Portal Website.
//
// There are three variants available:
//
// The Moving Train, which appears in some modes, such as Conquest.
//
// or two different Static train configurations, as seen in Breakthrough and Rush.
//
// You can also chose to have no train at all, which is the default setting.
////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL FUNCTIONS AND EVENTS ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// The following event is triggered by the Moving Train.
export function OnGolmudTrainStopped(stopReason: mod.GolmudTrainStopReason): void {
    // You can compare the stopReason with the following checks:
    if (mod.Equals(stopReason, mod.GolmudTrainStopReason.ReachedEastTerminal)) {
    }
    if (mod.Equals(stopReason, mod.GolmudTrainStopReason.ReachedWestTerminal)) {
    }
    if (mod.Equals(stopReason, mod.GolmudTrainStopReason.StoppedInTransit)) {
    }

    // You can use the following functions to control the train:
    mod.GolmudTrainSendMoveCommand(mod.GolmudTrainMoveCommands.MoveWest);
    mod.GolmudTrainSendMoveCommand(mod.GolmudTrainMoveCommands.Stop);
    mod.GolmudTrainSendMoveCommand(mod.GolmudTrainMoveCommands.MoveEast);

    // Note that the train needs 6 seconds to accelerate from stop, or to stop completely.
    // The train will not respond or queue instructions send while it is already doing so.

    // You can query the location of the train with the following function:
    const location = mod.GetGolmudTrainLocation();
}

// If a ControlPoint is set to "ConnectedToGolmudTrain" to True in the level editor,
// then the control point will move together with the train. The control point owner will
// also determine the direction the train moves.
//
// If Team 1 captures the control point, then the train will move West.
// If Team 2 captures the control point, then the train will move East.
// If the control point is neutralised, the train will stop.
//
// Soldiers of the team who owns the capture point can only deploy on it if is immobilised
// at one end or the other.
//
// For best results, the control point in the level editor should be at the proper position
// i.e. (-120.0, 703.0, 562.0)
// with the correct rotation
// i.e. (0°, 90°, 0°)
// And the Capture Area should match the size and heading of the train (a 40m x 10m prism)

////////////////////////////////////////////////////////////////////////////////////////////
//////// Also check out '_StartHere_BasicTemplate' for more examples and references! ///////
////////////////////////////////////////////////////////////////////////////////////////////
