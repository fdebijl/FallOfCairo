/* 

Portal Gadget is an equipable tool designed for creators building custom portal experiences. 
With Portal Gadget, you can bind and trigger custom gameplay logic at specific times and 
locations within your custom experience.

Using TypeScript, creators can:

Spawn or equip the gadget - Make the gadget available for players within your experience.
Assign custom logic - Bind your own gameplay script to the gadget's inputs and events.
Trigger events in-game - Activate your logic at any moment via PortalGadget's inputs.

Gone are the days of workaround solutions to trigger custom logic like "crouch to confirm".
Portal Gadget gives you the flexibility for specific player interaction and create dynamic 
experiences.

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// HOW TO EQUIP PORTAL GADGET ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
// There are two ways to equip and get started with PortalGadget.
// 1. Grant it directly to a player, replacing their current gadget.
export function OnPlayerDeployed(player: mod.Player) {
    mod.AddEquipment(player, mod.Gadgets.Misc_PortalGadget);
}

// 2. Spawn a lootable PortalGadget with LootSpawner placed in level.
// Remember to assign an ObjectId to the LootSpawner in Godot to be called.
mod.SpawnLoot(mod.GetLootSpawner(1), mod.Gadgets.Misc_PortalGadget);

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL FUNCTIONS AND EVENTS ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
// Following events are triggered by various PortalGadget inputs.

// This will trigger when a Player presses the Zoom button.
export function OnPortalGadgetAimStart(eventPlayer: mod.Player): void {}

// This will trigger when a Player releases the Zoom button.
export function OnPortalGadgetAimStop(eventPlayer: mod.Player): void {}

// This will trigger when a Player presses the Fire button.
export function OnPortalGadgetFireStart(eventPlayer: mod.Player): void {}

// This will trigger when a Player releases the Fire button.
export function OnPortalGadgetFireStop(eventPlayer: mod.Player): void {}

// This will trigger when a Player presses the Tactical Device (toggle flashlight/laser) button.
export function OnPortalGadgetLaserToggle(eventPlayer: mod.Player, eventBoolean: boolean): void {}

// Useful functions and events to use in conjunction with PortalGadget to create more complex behaviors or feedbacks.

// Request the system to evaluate if a straight line between two points is interupted or not. Use OnRayCastHit and OnRayCastMissed to read the result.
export function RayCast(player: mod.Player, start: mod.Vector, stop: mod.Vector): void {}

// This will trigger when a Raycast hits a target.
export function OnRayCastHit(eventPlayer: mod.Player, eventPoint: mod.Vector, eventNormal: mod.Vector): void {}

// This will trigger when a Raycast is called and doesn't hit any target.
export function OnRayCastMissed(eventPlayer: mod.Player): void {}

// Displays a message on the world log above the minimap for 6 seconds. If no target is provided, it will display the message to everyone.
export function DisplayHighlightedWorldLogMessage(message: mod.Message, player: mod.Player): void {}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Also check out '_StartHere_BasicTemplate' for more examples and references! //
////////////////////////////////////////////////////////////////////////////////////////////////////////
