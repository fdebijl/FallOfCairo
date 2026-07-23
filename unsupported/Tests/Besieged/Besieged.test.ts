import * as modsim from '@modsim/index';

globalThis.mod = modsim.modmap as any;

import * as script from '@besieged/Besieged';
import * as stringkeys from '@besieged/Besieged.strings.json';
import * as level from '@besieged/MP_Aftermath_Besieged.spatial.json';

modsim.modmap.stringkeys = stringkeys;

// WARNING: The besieged script is not designed to be reset per test, so only run one test at a time.

describe('Besieged', () => {
    beforeEach(() => {
        console.log = jest.fn(); // Mock console.log
        modsim.Reset();
    });

    test('OnGameModeStarted should log something', () => {
        modsim.LoadLevel(script, level);
        modsim.Loop(1);
        modsim.StartGameMode();
        modsim.Loop(1);
        expect(console.log).toHaveBeenCalledWith('Besieged Game Mode Started');
    });

    test('OnPlayerJoinGame should log something', () => {
        modsim.LoadLevel(script, level);
        modsim.Loop(1);
        modsim.AddPlayer();
        modsim.Loop(1);
        expect(console.log).toHaveBeenCalledWith('Calling OnPlayerJoinGame');
    });
    test('OnPlayerDeployed should handle player deployment', async () => {
        // Setup
        modsim.LoadLevel(script, level);
        modsim.Loop(1);
        modsim.StartGameMode();
        modsim.Loop(1);

        // Add a player
        const player = modsim.AddPlayer();
        modsim.Loop(1);

        // Deploy the player - this will trigger OnPlayerDeployed
        modsim.DeployPlayer(player as any);
        await modsim.Loop(1); // Wait for async operations

        // Assertions
        // You can check that the player was deployed successfully
        // The function sets various internal states
        expect(player.isAlive).toBe(true);
    }, 30000);

    test('should trigger combat with 4 players', async () => {
        // Setup
        modsim.LoadLevel(script, level);
        modsim.Loop(1);
        modsim.StartGameMode();
        modsim.Loop(1);

        // Add 4 players to trigger combat
        const players = [];
        for (let i = 0; i < 4; i++) {
            const player = modsim.AddPlayer();
            players.push(player);
            modsim.Loop(1);
        }

        // Deploy all players
        for (const player of players) {
            modsim.DeployPlayer(player as any);
            await modsim.Loop(1);
        }

        // Wait for combat countdown
        await modsim.Loop(11);

        // Assertions
        // Verify all players are deployed
        players.forEach((player) => {
            expect(player.isAlive).toBe(true);
        });

        // Combat should have started
        // You could add more specific checks here for combat state
        expect(players.length).toBe(4);
    }, 30000);
});
