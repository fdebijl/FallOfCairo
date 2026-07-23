/* 

Physics impulse is a new feature provided to let creators manipulating objects like vehicle
with physical impulse force. 

Using TypeScript, creators can:

Apply area type impulse in a world location, where the area is defined with sphere shape, 
a sphere cast query executed to detect objects overlapping the sphere. Then, impulse is
applied with direction from centre of sphere to the object. Creators can also deal damage
to objects affected and override with fixed impulse direction (instead of coming from centre)

Apply impulse to a single object(vehicle) with given impulse direction and strength.

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// AVAILABLE FUNCTIONS ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

const center = mod.CreateVector(0, 0, 0);
const radius = 1;
const impulseStrength = 1;
const damageAmount = 10;
const impulseDirection = mod.ForwardVector();

// Trigger an area(sphere) query with the given center and radius, apply radial impulse and damage to objects detected
mod.ApplyAreaImpulseAndDamage(center, radius, impulseStrength, damageAmount);

// Same as above, but overriding the evaluated radial impulse to a fixed direction impulse
mod.ApplyAreaImpulseAndDamage(center, radius, impulseStrength, damageAmount, impulseDirection);

const player = mod.ClosestPlayerTo(center);
const vehicle = mod.GetVehicleFromPlayer(player);
const worldPosition = mod.CreateVector(0, 0, 0);
const direction = mod.ForwardVector();
const magnitude = 5;

// Apply impulse at worldPosition to the given Vehicle
mod.ApplyImpulse(vehicle, worldPosition, direction, magnitude);


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
[Important Notes ***]

1. The "impulse strength/magniude" value here is SI Unit (Newton-second) or (Kilogram-meter per second). 
   It means the reaction on the object is depending on its weight(or mass). So, the same 1000 impulse can
   barely push a heavy truck, but it could send a bike fly away. 
 
2. "damageAmount" in 'ApplyAreaImpulseAndDamage' can be zero, damage is optional.
 
3. Be aware of performance issue when using 'ApplyAreaImpulseAndDamage'. The area-objects query could be
   expensive if a large radius was defined. Depending on the query result, iterating through all detected
   objects and applying impulse on all of them may also pose a preformance concern.
   
4. The "worldPosition" in 'ApplyImpulse' is a point in the world where we are applying the impulse. It is
   not necessary to be inside the object. You think of it as a lever connecting between the center of mass
   of the object and this impulse point.
*/
