/* 

Portal Performance is a new set of features provided to let creators check on the Server game performance

Using TypeScript, creators can:

- Get the overall Server game average frame time in milliseconds 
- Get the Portal process specific average frame time in milliseconds 

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// AVAILABLE FUNCTIONS ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// Get the Portal process specific average frame time in milliseconds
mod.GetPortalAverageFrameTime();

// Get the overall Server game average frame time in milliseconds
mod.GetServerAverageFrameTime();

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
[Note]
1. The average frame time is calculated based on a faction of the history frame time.
2. The average frame time is not being updated every single frame, so you may get the same value if calling the function too frequent.
3. Server game frame time is the overall server frame time, including all game logic update(e.g. UI, physics, game logic and also Portal process)
4. Portal frame time is the processing time for Portal funtion calls/update. You may expect higher Portal frame time if you have a very complicated(or not optimized) blockly/typescript logic. Note that this Portal frame time contributes to the overall Server game frame time. 

[Tips]
1. Adding game feature/logic one by one so you can track the performance of each piece, or having a bool to toggle ON/OFF for each feature for better profiling. 
2. You can also make use of the frame time to adjust game features.  e.g. reducing AI bots, vehicle spawning, or simplify update logic/frequency during bad frames
   
*/
