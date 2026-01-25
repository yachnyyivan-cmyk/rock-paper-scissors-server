/**
 * @fileoverview Unit tests for GameState class
 */

const GameState = require('../shared/GameState');
const { MOVES, GAME_MODES, GAME_STATUS } = require('../shared/gameUtils');

describe('GameState', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState('test-game-1', GAME_MODES.PVP);
    });

    afterEach(() => {
        // Clean up any timers
        if (gameState) {
            gameState.clearAllTimers();
        }
    });

    describe('Constructor and Initialization', () => {
        test('should create a new game state with correct initial values', () => {
            const state = gameState.getState();
            
            expect(state.gameId).toBe('test-game-1');
            expect(state.mode).toBe(GAME_MODES.PVP);
            expect(state.players).toEqual([]);
            expect(state.currentRound).toBe(0);
            expect(state.maxRounds).toBe(5);
            expect(state.status).toBe(GAME_STATUS.WAITING);
            expect(state.winner).toBeNull();
            expect(state.createdAt).toBeInstanceOf(Date);
        });

        test('should accept custom options', () => {
            const customGame = new GameState('custom-game', GAME_MODES.PVAI, {
                maxRounds: 3,
                aiDifficulty: 'hard',
                moveTimeout: 10000
            });
            
            const state = customGame.getState();
            expect(state.maxRounds).toBe(3);
            expect(state.aiDifficulty).toBe('hard');
            expect(customGame.moveTimeout).toBe(10000);
        });
    });

    describe('Player Management', () => {
        test('should add players successfully', () => {
            expect(gameState.addPlayer('player1', 'Alice')).toBe(true);
            expect(gameState.addPlayer('player2', 'Bob')).toBe(true);
            
            const state = gameState.getState();
            expect(state.players).toHaveLength(2);
            expect(state.players[0].id).toBe('player1');
            expect(state.players[0].name).toBe('Alice');
            expect(state.players[1].id).toBe('player2');
            expect(state.players[1].name).toBe('Bob');
        });

        test('should not add more than 2 players', () => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
            
            expect(gameState.addPlayer('player3', 'Charlie')).toBe(false);
            expect(gameState.getState().players).toHaveLength(2);
        });

        test('should not add duplicate players', () => {
            gameState.addPlayer('player1', 'Alice');
            
            expect(gameState.addPlayer('player1', 'Alice Again')).toBe(false);
            expect(gameState.getState().players).toHaveLength(1);
        });

        test('should start game when 2 players are added', () => {
            gameState.addPlayer('player1', 'Alice');
            expect(gameState.getState().status).toBe(GAME_STATUS.WAITING);
            
            gameState.addPlayer('player2', 'Bob');
            expect(gameState.getState().status).toBe(GAME_STATUS.PLAYING);
        });

        test('should remove players successfully', () => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
            
            expect(gameState.removePlayer('player1')).toBe(true);
            expect(gameState.getState().players).toHaveLength(1);
            expect(gameState.getState().players[0].id).toBe('player2');
        });

        test('should end PvP game when player count drops below 2', () => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
            
            gameState.removePlayer('player1');
            expect(gameState.getState().status).toBe(GAME_STATUS.FINISHED);
        });
    });

    describe('Move Validation and Processing', () => {
        beforeEach(() => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
        });

        test('should accept valid moves', () => {
            const result = gameState.makeMove('player1', MOVES.ROCK);
            
            expect(result.success).toBe(true);
            expect(result.message).toBe('Move registered successfully');
            
            const state = gameState.getState();
            expect(state.players[0].currentMove).toBe(MOVES.ROCK);
            expect(state.players[0].isReady).toBe(true);
        });

        test('should reject invalid moves', () => {
            const result = gameState.makeMove('player1', 'invalid-move');
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid move provided');
        });

        test('should reject moves from non-existent players', () => {
            const result = gameState.makeMove('non-existent', MOVES.ROCK);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Player not found in game');
        });

        test('should reject duplicate moves in same round', () => {
            gameState.makeMove('player1', MOVES.ROCK);
            const result = gameState.makeMove('player1', MOVES.PAPER);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Player has already made a move this round');
        });

        test('should reject moves when game is not playing', () => {
            gameState.state.status = GAME_STATUS.FINISHED;
            const result = gameState.makeMove('player1', MOVES.ROCK);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Game is not in playing state');
        });
    });

    describe('Rock Paper Scissors Game Rules', () => {
        beforeEach(() => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
        });

        test('Rock beats Scissors', () => {
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.SCISSORS);
            
            const state = gameState.getState();
            expect(state.players[0].score).toBe(1); // player1 wins
            expect(state.players[1].score).toBe(0);
        });

        test('Paper beats Rock', () => {
            gameState.makeMove('player1', MOVES.PAPER);
            gameState.makeMove('player2', MOVES.ROCK);
            
            const state = gameState.getState();
            expect(state.players[0].score).toBe(1); // player1 wins
            expect(state.players[1].score).toBe(0);
        });

        test('Scissors beats Paper', () => {
            gameState.makeMove('player1', MOVES.SCISSORS);
            gameState.makeMove('player2', MOVES.PAPER);
            
            const state = gameState.getState();
            expect(state.players[0].score).toBe(1); // player1 wins
            expect(state.players[1].score).toBe(0);
        });

        test('Tie results in no score change', () => {
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.ROCK);
            
            const state = gameState.getState();
            expect(state.players[0].score).toBe(0);
            expect(state.players[1].score).toBe(0);
        });

        test('should process round automatically when both players move', () => {
            const initialRound = gameState.getState().currentRound;
            
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.SCISSORS);
            
            const state = gameState.getState();
            expect(state.currentRound).toBe(initialRound + 1);
            expect(state.players[0].currentMove).toBeNull(); // Reset for next round
            expect(state.players[1].currentMove).toBeNull();
            expect(state.players[0].isReady).toBe(false);
            expect(state.players[1].isReady).toBe(false);
        });
    });

    describe('Scoring System and Round Management', () => {
        beforeEach(() => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
        });

        test('should track scores correctly across multiple rounds', () => {
            // Round 1: player1 wins
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.SCISSORS);
            
            // Round 2: player2 wins
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.PAPER);
            
            // Round 3: tie
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.ROCK);
            
            const state = gameState.getState();
            expect(state.players[0].score).toBe(1);
            expect(state.players[1].score).toBe(1);
            expect(state.currentRound).toBe(3);
        });

        test('should end game when a player reaches max rounds (first to 5)', () => {
            // Simulate player1 winning 5 rounds
            for (let i = 0; i < 5; i++) {
                gameState.makeMove('player1', MOVES.ROCK);
                gameState.makeMove('player2', MOVES.SCISSORS);
            }
            
            const state = gameState.getState();
            expect(state.status).toBe(GAME_STATUS.FINISHED);
            expect(state.winner).toBe('player1');
            expect(state.finishedAt).toBeInstanceOf(Date);
        });

        test('should continue game until someone reaches max rounds', () => {
            // Play 4 rounds with alternating wins
            for (let i = 0; i < 4; i++) {
                if (i % 2 === 0) {
                    gameState.makeMove('player1', MOVES.ROCK);
                    gameState.makeMove('player2', MOVES.SCISSORS);
                } else {
                    gameState.makeMove('player1', MOVES.SCISSORS);
                    gameState.makeMove('player2', MOVES.ROCK);
                }
            }
            
            const state = gameState.getState();
            expect(state.status).toBe(GAME_STATUS.PLAYING);
            expect(state.winner).toBeNull();
            expect(state.players[0].score).toBe(2);
            expect(state.players[1].score).toBe(2);
        });

        test('should reset game state correctly', () => {
            // Play some rounds
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.SCISSORS);
            gameState.makeMove('player1', MOVES.PAPER);
            gameState.makeMove('player2', MOVES.ROCK);
            
            gameState.resetGame();
            
            const state = gameState.getState();
            expect(state.currentRound).toBe(0);
            expect(state.winner).toBeNull();
            expect(state.finishedAt).toBeNull();
            expect(state.status).toBe(GAME_STATUS.PLAYING);
            expect(state.players[0].score).toBe(0);
            expect(state.players[1].score).toBe(0);
            expect(state.players[0].currentMove).toBeNull();
            expect(state.players[1].currentMove).toBeNull();
        });
    });

    describe('Move Timeout Handling', () => {
        beforeEach(() => {
            gameState = new GameState('timeout-test', GAME_MODES.PVP, { moveTimeout: 100 }); // 100ms for testing
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
        });

        test('should auto-select rock when player times out', (done) => {
            // Clear any existing timers and start fresh
            gameState.clearAllTimers();
            gameState.startNewRound();
            
            // Only player2 makes a move, player1 should timeout
            gameState.makeMove('player2', MOVES.PAPER);
            
            setTimeout(() => {
                const state = gameState.getState();
                // After timeout, the round should be processed
                expect(state.currentRound).toBe(1); // Round should have been processed
                expect(state.players[1].score).toBe(1); // Paper beats Rock (auto-selected)
                done();
            }, 150);
        });
    });

    describe('Game Statistics', () => {
        beforeEach(() => {
            gameState.addPlayer('player1', 'Alice');
            gameState.addPlayer('player2', 'Bob');
        });

        test('should calculate game statistics correctly', () => {
            // Play 3 rounds: player1 wins 2, player2 wins 1
            gameState.makeMove('player1', MOVES.ROCK);
            gameState.makeMove('player2', MOVES.SCISSORS);
            
            gameState.makeMove('player1', MOVES.SCISSORS);
            gameState.makeMove('player2', MOVES.ROCK);
            
            gameState.makeMove('player1', MOVES.PAPER);
            gameState.makeMove('player2', MOVES.ROCK);
            
            const stats = gameState.getStats();
            expect(stats.totalRounds).toBe(3);
            expect(stats.gameStatus).toBe(GAME_STATUS.PLAYING);
            expect(stats.players[0].winRate).toBe('66.7'); // 2/3 * 100
            expect(stats.players[1].winRate).toBe('33.3'); // 1/3 * 100
        });

        test('should include game duration when finished', (done) => {
            // Add a small delay to ensure measurable time passes
            setTimeout(() => {
                // Finish the game
                for (let i = 0; i < 5; i++) {
                    gameState.makeMove('player1', MOVES.ROCK);
                    gameState.makeMove('player2', MOVES.SCISSORS);
                }
                
                const stats = gameState.getStats();
                expect(stats.gameDuration).toBeGreaterThanOrEqual(0);
                expect(typeof stats.gameDuration).toBe('number');
                done();
            }, 10);
        });
    });

    describe('State Validation', () => {
        test('should validate correct game state', () => {
            gameState.addPlayer('player1', 'Alice');
            expect(gameState.isValidState()).toBe(true);
        });

        test('should detect invalid game state', () => {
            // Corrupt the state
            gameState.state.gameId = null;
            expect(gameState.isValidState()).toBe(false);
        });
    });
});