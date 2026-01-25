/**
 * @fileoverview Unit tests for GameSession class
 */

const GameSession = require('../shared/GameSession');
const { MOVES, GAME_MODES, GAME_STATUS } = require('../shared/gameUtils');

describe('GameSession', () => {
    let session;

    beforeEach(() => {
        session = new GameSession('test-session-1', GAME_MODES.PVP);
    });

    afterEach(() => {
        if (session) {
            session.endSession();
        }
    });

    describe('Constructor and Initialization', () => {
        test('should create a new session with correct initial values', () => {
            expect(session.sessionId).toBe('test-session-1');
            expect(session.mode).toBe(GAME_MODES.PVP);
            expect(session.maxPlayers).toBe(2);
            expect(session.isActive).toBe(true);
            expect(session.players.size).toBe(0);
            expect(session.playerOrder).toEqual([]);
            expect(session.roomCode).toBeDefined();
            expect(session.roomCode.length).toBe(6);
            expect(session.createdAt).toBeInstanceOf(Date);
            expect(session.lastActivityAt).toBeInstanceOf(Date);
        });

        test('should accept custom options', () => {
            const customSession = new GameSession('custom-session', GAME_MODES.PVAI, {
                maxRounds: 3,
                moveTimeout: 10000,
                roomCode: 'CUSTOM',
                aiDifficulty: 'hard'
            });
            
            expect(customSession.settings.maxRounds).toBe(3);
            expect(customSession.settings.moveTimeout).toBe(10000);
            expect(customSession.roomCode).toBe('CUSTOM');
            expect(customSession.settings.aiDifficulty).toBe('hard');
        });
    });

    describe('Player Management', () => {
        test('should add players successfully', () => {
            const result1 = session.addPlayer('player1', 'Alice');
            const result2 = session.addPlayer('player2', 'Bob');
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(session.players.size).toBe(2);
            expect(session.playerOrder).toEqual(['player1', 'player2']);
            expect(session.sessionStats.playerJoins).toBe(2);
        });

        test('should not add more than max players', () => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
            
            const result = session.addPlayer('player3', 'Charlie');
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Session is full');
            expect(session.players.size).toBe(2);
        });

        test('should not add duplicate players', () => {
            session.addPlayer('player1', 'Alice');
            
            const result = session.addPlayer('player1', 'Alice Again');
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Player already in session');
            expect(session.players.size).toBe(1);
        });

        test('should not add players to inactive session', () => {
            session.endSession();
            
            const result = session.addPlayer('player1', 'Alice');
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Session is not active');
        });

        test('should remove players successfully', () => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
            
            const result = session.removePlayer('player1');
            
            expect(result.success).toBe(true);
            expect(session.players.size).toBe(1);
            expect(session.playerOrder).toEqual(['player2']);
            expect(session.sessionStats.playerLeaves).toBe(1);
        });

        test('should end PvP session when players drop below 2', () => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
            
            session.removePlayer('player1');
            
            expect(session.isActive).toBe(false);
        });

        test('should not remove non-existent players', () => {
            const result = session.removePlayer('non-existent');
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Player not found in session');
        });
    });

    describe('Game Flow and Move Processing', () => {
        beforeEach(() => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
        });

        test('should process moves successfully', () => {
            const result1 = session.makeMove('player1', MOVES.ROCK);
            const result2 = session.makeMove('player2', MOVES.SCISSORS);
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            
            // Check that round was processed
            const state = session.getSessionState();
            expect(state.gameState.currentRound).toBe(1);
            expect(state.gameState.players[0].score).toBe(1); // Rock beats Scissors
        });

        test('should not process moves from non-existent players', () => {
            const result = session.makeMove('non-existent', MOVES.ROCK);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Player not found in session');
        });

        test('should not process moves in inactive session', () => {
            session.endSession();
            
            const result = session.makeMove('player1', MOVES.ROCK);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Session is not active');
        });

        test('should update player statistics after rounds', () => {
            // Player1 wins
            session.makeMove('player1', MOVES.ROCK);
            session.makeMove('player2', MOVES.SCISSORS);
            
            const player1 = session.players.get('player1');
            const player2 = session.players.get('player2');
            
            expect(player1.statistics.totalWins).toBe(1);
            expect(player2.statistics.totalLosses).toBe(1);
        });

        test('should complete game when max rounds reached', () => {
            // Simulate player1 winning 5 rounds
            for (let i = 0; i < 5; i++) {
                session.makeMove('player1', MOVES.ROCK);
                session.makeMove('player2', MOVES.SCISSORS);
            }
            
            const state = session.getSessionState();
            expect(state.gameState.status).toBe(GAME_STATUS.FINISHED);
            expect(state.gameState.winner).toBe('player1');
            expect(session.sessionStats.totalGames).toBe(1);
        });
    });

    describe('Game Session Management', () => {
        beforeEach(() => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
        });

        test('should start new game successfully', () => {
            // Play and finish a game first
            for (let i = 0; i < 5; i++) {
                session.makeMove('player1', MOVES.ROCK);
                session.makeMove('player2', MOVES.SCISSORS);
            }
            
            const result = session.startNewGame();
            
            expect(result.success).toBe(true);
            
            const state = session.getSessionState();
            expect(state.gameState.status).toBe(GAME_STATUS.PLAYING);
            expect(state.gameState.currentRound).toBe(0);
            expect(state.gameState.winner).toBeNull();
            expect(state.players[0].score).toBe(0);
            expect(state.players[1].score).toBe(0);
        });

        test('should not start new game without enough players', () => {
            // Create a new session with only one player to avoid auto-ending
            const singlePlayerSession = new GameSession('single-player', GAME_MODES.PVP);
            singlePlayerSession.addPlayer('player1', 'Alice');
            
            const result = singlePlayerSession.startNewGame();
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Not enough players to start game');
            
            singlePlayerSession.endSession();
        });

        test('should not start new game in inactive session', () => {
            session.endSession();
            
            const result = session.startNewGame();
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Session is not active');
        });

        test('should end session correctly', () => {
            session.endSession('manual');
            
            expect(session.isActive).toBe(false);
        });
    });

    describe('Connection Management', () => {
        beforeEach(() => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
        });

        test('should update player connection status', () => {
            session.updatePlayerConnection('player1', false);
            
            const player1 = session.players.get('player1');
            expect(player1.isConnected).toBe(false);
        });

        test('should handle connection updates for non-existent players gracefully', () => {
            // Should not throw error
            session.updatePlayerConnection('non-existent', false);
        });
    });

    describe('Session Statistics and State', () => {
        beforeEach(() => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
        });

        test('should get complete session state', () => {
            const state = session.getSessionState();
            
            expect(state.sessionId).toBe('test-session-1');
            expect(state.mode).toBe(GAME_MODES.PVP);
            expect(state.isActive).toBe(true);
            expect(state.players).toHaveLength(2);
            expect(state.playerOrder).toEqual(['player1', 'player2']);
            expect(state.gameState).toBeDefined();
            expect(state.sessionStats).toBeDefined();
        });

        test('should get comprehensive session statistics', () => {
            // Play some rounds
            session.makeMove('player1', MOVES.ROCK);
            session.makeMove('player2', MOVES.SCISSORS);
            
            const stats = session.getSessionStatistics();
            
            expect(stats.sessionDuration).toBeGreaterThanOrEqual(0);
            expect(stats.activePlayers).toBe(2);
            expect(stats.totalRounds).toBe(1);
            expect(stats.gameStats).toBeDefined();
            expect(stats.playerStatistics).toHaveLength(2);
        });

        test('should detect session timeout', () => {
            // Simulate old last activity
            session.lastActivityAt = new Date(Date.now() - 400000); // 400 seconds ago
            session.settings.sessionTimeout = 300000; // 5 minutes
            
            expect(session.hasTimedOut()).toBe(true);
            
            // Update activity
            session.lastActivityAt = new Date();
            expect(session.hasTimedOut()).toBe(false);
        });
    });

    describe('Event System', () => {
        test('should register and emit events correctly', () => {
            let eventData = null;
            const callback = (data) => { eventData = data; };
            
            session.on('testEvent', callback);
            session.emitEvent('testEvent', { test: 'data' });
            
            expect(eventData).toEqual({ test: 'data' });
        });

        test('should remove event callbacks correctly', () => {
            let eventCalled = false;
            const callback = () => { eventCalled = true; };
            
            session.on('testEvent', callback);
            session.off('testEvent', callback);
            session.emitEvent('testEvent', {});
            
            expect(eventCalled).toBe(false);
        });

        test('should handle callback errors gracefully', () => {
            const errorCallback = () => { throw new Error('Test error'); };
            const goodCallback = jest.fn();
            
            session.on('testEvent', errorCallback);
            session.on('testEvent', goodCallback);
            
            // Should not throw error
            session.emitEvent('testEvent', {});
            
            // Good callback should still be called
            expect(goodCallback).toHaveBeenCalled();
        });
    });

    describe('Serialization', () => {
        beforeEach(() => {
            session.addPlayer('player1', 'Alice');
            session.addPlayer('player2', 'Bob');
        });

        test('should serialize to JSON correctly', () => {
            session.makeMove('player1', MOVES.ROCK);
            session.makeMove('player2', MOVES.SCISSORS);
            
            const json = session.toJSON();
            
            expect(json.sessionId).toBe('test-session-1');
            expect(json.mode).toBe(GAME_MODES.PVP);
            expect(json.isActive).toBe(true);
            expect(json.players).toHaveLength(2);
            expect(json.gameState).toBeDefined();
            expect(json.sessionStats).toBeDefined();
        });

        test('should deserialize from JSON correctly', () => {
            session.makeMove('player1', MOVES.ROCK);
            session.makeMove('player2', MOVES.SCISSORS);
            
            const json = session.toJSON();
            const restored = GameSession.fromJSON(json);
            
            expect(restored.sessionId).toBe(session.sessionId);
            expect(restored.mode).toBe(session.mode);
            expect(restored.isActive).toBe(session.isActive);
            expect(restored.players.size).toBe(2);
            expect(restored.playerOrder).toEqual(session.playerOrder);
        });
    });

    describe('Validation', () => {
        test('should validate correct session data', () => {
            expect(session.isValid()).toBe(true);
        });

        test('should detect invalid session data', () => {
            session.sessionId = '';
            expect(session.isValid()).toBe(false);
            
            session.sessionId = 'valid-id';
            session.mode = 'invalid-mode';
            expect(session.isValid()).toBe(false);
            
            session.mode = GAME_MODES.PVP;
            session.roomCode = '';
            expect(session.isValid()).toBe(false);
        });
    });
});