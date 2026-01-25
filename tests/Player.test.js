/**
 * @fileoverview Unit tests for Player class
 */

const Player = require('../shared/Player');
const { MOVES } = require('../shared/gameUtils');

describe('Player', () => {
    let player;

    beforeEach(() => {
        player = new Player('player1', 'Alice');
    });

    describe('Constructor and Initialization', () => {
        test('should create a new player with correct initial values', () => {
            expect(player.id).toBe('player1');
            expect(player.name).toBe('Alice');
            expect(player.score).toBe(0);
            expect(player.currentMove).toBeNull();
            expect(player.isReady).toBe(false);
            expect(player.isConnected).toBe(true);
            expect(player.moveHistory).toEqual([]);
            expect(player.isAI).toBe(false);
            expect(player.aiDifficulty).toBeNull();
            expect(player.createdAt).toBeInstanceOf(Date);
            expect(player.lastActiveAt).toBeInstanceOf(Date);
        });

        test('should accept AI player options', () => {
            const aiPlayer = new Player('ai1', 'AI Bot', {
                isAI: true,
                aiDifficulty: 'hard'
            });
            
            expect(aiPlayer.isAI).toBe(true);
            expect(aiPlayer.aiDifficulty).toBe('hard');
        });

        test('should initialize statistics correctly', () => {
            expect(player.statistics.totalGames).toBe(0);
            expect(player.statistics.totalWins).toBe(0);
            expect(player.statistics.totalLosses).toBe(0);
            expect(player.statistics.totalTies).toBe(0);
            expect(player.statistics.moveFrequency.rock).toBe(0);
            expect(player.statistics.moveFrequency.paper).toBe(0);
            expect(player.statistics.moveFrequency.scissors).toBe(0);
        });
    });

    describe('Move Management', () => {
        test('should set valid moves successfully', () => {
            const result = player.setMove(MOVES.ROCK);
            
            expect(result).toBe(true);
            expect(player.currentMove).toBe(MOVES.ROCK);
            expect(player.isReady).toBe(true);
            expect(player.moveHistory).toHaveLength(1);
            expect(player.moveHistory[0].move).toBe(MOVES.ROCK);
            expect(player.statistics.moveFrequency.rock).toBe(1);
        });

        test('should reject invalid moves', () => {
            const result = player.setMove('invalid-move');
            
            expect(result).toBe(false);
            expect(player.currentMove).toBeNull();
            expect(player.isReady).toBe(false);
            expect(player.moveHistory).toHaveLength(0);
        });

        test('should reject duplicate moves in same round', () => {
            player.setMove(MOVES.ROCK);
            const result = player.setMove(MOVES.PAPER);
            
            expect(result).toBe(false);
            expect(player.currentMove).toBe(MOVES.ROCK);
            expect(player.moveHistory).toHaveLength(1);
        });

        test('should clear moves correctly', () => {
            player.setMove(MOVES.ROCK);
            player.clearMove();
            
            expect(player.currentMove).toBeNull();
            expect(player.isReady).toBe(false);
            // Move history should remain
            expect(player.moveHistory).toHaveLength(1);
        });

        test('should track move history with timestamps', () => {
            const beforeMove = new Date();
            player.setMove(MOVES.ROCK);
            const afterMove = new Date();
            
            expect(player.moveHistory).toHaveLength(1);
            expect(player.moveHistory[0].move).toBe(MOVES.ROCK);
            expect(player.moveHistory[0].timestamp).toBeInstanceOf(Date);
            expect(player.moveHistory[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeMove.getTime());
            expect(player.moveHistory[0].timestamp.getTime()).toBeLessThanOrEqual(afterMove.getTime());
            expect(player.moveHistory[0].round).toBe(1);
        });
    });

    describe('Statistics Management', () => {
        test('should update statistics for wins correctly', () => {
            player.updateStatistics('win');
            
            expect(player.statistics.totalGames).toBe(1);
            expect(player.statistics.totalWins).toBe(1);
            expect(player.statistics.totalLosses).toBe(0);
            expect(player.statistics.totalTies).toBe(0);
            expect(player.statistics.currentStreak).toBe(1);
            expect(player.statistics.winStreak).toBe(1);
            expect(player.statistics.longestWinStreak).toBe(1);
        });

        test('should update statistics for losses correctly', () => {
            // First win to establish a streak
            player.updateStatistics('win');
            player.updateStatistics('win');
            
            // Then a loss
            player.updateStatistics('loss');
            
            expect(player.statistics.totalGames).toBe(3);
            expect(player.statistics.totalWins).toBe(2);
            expect(player.statistics.totalLosses).toBe(1);
            expect(player.statistics.currentStreak).toBe(0); // Reset on loss
            expect(player.statistics.longestWinStreak).toBe(2); // Preserved
        });

        test('should update statistics for ties correctly', () => {
            player.updateStatistics('win');
            player.updateStatistics('tie');
            
            expect(player.statistics.totalGames).toBe(2);
            expect(player.statistics.totalWins).toBe(1);
            expect(player.statistics.totalTies).toBe(1);
            expect(player.statistics.currentStreak).toBe(1); // Ties don't break streaks
        });

        test('should track longest win streak correctly', () => {
            // First streak of 3
            player.updateStatistics('win');
            player.updateStatistics('win');
            player.updateStatistics('win');
            player.updateStatistics('loss');
            
            // Second streak of 2
            player.updateStatistics('win');
            player.updateStatistics('win');
            
            expect(player.statistics.longestWinStreak).toBe(3);
            expect(player.statistics.currentStreak).toBe(2);
        });

        test('should increment score and update win statistics', () => {
            player.incrementScore();
            
            expect(player.score).toBe(1);
            expect(player.statistics.totalWins).toBe(1);
            expect(player.statistics.totalGames).toBe(1);
        });

        test('should record losses without changing score', () => {
            player.recordLoss();
            
            expect(player.score).toBe(0);
            expect(player.statistics.totalLosses).toBe(1);
            expect(player.statistics.totalGames).toBe(1);
        });
    });

    describe('Move Pattern Analysis', () => {
        beforeEach(() => {
            // Set up some move history
            player.setMove(MOVES.ROCK);
            player.clearMove();
            player.setMove(MOVES.ROCK);
            player.clearMove();
            player.setMove(MOVES.PAPER);
            player.clearMove();
            player.setMove(MOVES.SCISSORS);
            player.clearMove();
        });

        test('should analyze move patterns correctly', () => {
            const patterns = player.getMovePatterns();
            
            expect(patterns.totalMoves).toBe(4);
            expect(patterns.frequencies.rock).toBe(2);
            expect(patterns.frequencies.paper).toBe(1);
            expect(patterns.frequencies.scissors).toBe(1);
            expect(patterns.percentages.rock).toBe('50.0');
            expect(patterns.percentages.paper).toBe('25.0');
            expect(patterns.percentages.scissors).toBe('25.0');
            expect(patterns.mostFrequentMove).toBe(MOVES.ROCK);
        });

        test('should return recent moves correctly', () => {
            const recentMoves = player.getRecentMoves(3);
            
            expect(recentMoves).toHaveLength(3);
            expect(recentMoves[0].move).toBe(MOVES.ROCK); // Second rock
            expect(recentMoves[1].move).toBe(MOVES.PAPER);
            expect(recentMoves[2].move).toBe(MOVES.SCISSORS);
        });

        test('should handle empty move history', () => {
            const emptyPlayer = new Player('empty', 'Empty');
            const patterns = emptyPlayer.getMovePatterns();
            
            expect(patterns.totalMoves).toBe(0);
            expect(patterns.mostFrequentMove).toBeNull();
            expect(patterns.percentages.rock).toBe(0);
        });
    });

    describe('Connection and Activity Management', () => {
        test('should set connection status correctly', () => {
            const beforeDisconnect = new Date();
            player.setConnectionStatus(false);
            
            expect(player.isConnected).toBe(false);
            
            player.setConnectionStatus(true);
            expect(player.isConnected).toBe(true);
            expect(player.lastActiveAt.getTime()).toBeGreaterThanOrEqual(beforeDisconnect.getTime());
        });

        test('should check activity status correctly', () => {
            // Player should be active initially
            expect(player.isActive(30000)).toBe(true);
            
            // Simulate old last activity
            player.lastActiveAt = new Date(Date.now() - 35000); // 35 seconds ago
            expect(player.isActive(30000)).toBe(false);
            
            // Disconnected player should not be active
            player.lastActiveAt = new Date();
            player.setConnectionStatus(false);
            expect(player.isActive(30000)).toBe(false);
        });
    });

    describe('Game State Management', () => {
        test('should reset game state correctly', () => {
            // Set up some game state
            player.score = 3;
            player.setMove(MOVES.ROCK);
            player.statistics.winStreak = 2;
            player.statistics.currentStreak = 2;
            
            player.resetGameState();
            
            expect(player.score).toBe(0);
            expect(player.currentMove).toBeNull();
            expect(player.isReady).toBe(false);
            expect(player.statistics.winStreak).toBe(0);
            expect(player.statistics.currentStreak).toBe(0);
            // Other statistics should remain
            expect(player.moveHistory.length).toBeGreaterThan(0);
        });

        test('should get comprehensive statistics', () => {
            player.incrementScore();
            player.recordLoss();
            player.setMove(MOVES.ROCK);
            
            const stats = player.getStatistics();
            
            expect(stats.winRate).toBe(50.0); // 1 win out of 2 games
            expect(stats.currentScore).toBe(1);
            expect(stats.totalMoves).toBe(1);
            expect(stats.averageMovesPerGame).toBe('0.5');
            expect(stats.isActive).toBe(true);
            expect(stats.accountAge).toBe(0); // Created today
        });
    });

    describe('Serialization', () => {
        test('should serialize to JSON correctly', () => {
            player.setMove(MOVES.ROCK);
            player.incrementScore();
            
            const json = player.toJSON();
            
            expect(json.id).toBe('player1');
            expect(json.name).toBe('Alice');
            expect(json.score).toBe(1);
            expect(json.currentMove).toBe(MOVES.ROCK);
            expect(json.isReady).toBe(true);
            expect(json.statistics).toBeDefined();
            expect(json.moveHistory).toBeUndefined(); // Not included by default
        });

        test('should serialize with history when requested', () => {
            player.setMove(MOVES.ROCK);
            
            const json = player.toJSON(true);
            
            expect(json.moveHistory).toBeDefined();
            expect(json.moveHistory).toHaveLength(1);
        });

        test('should deserialize from JSON correctly', () => {
            player.setMove(MOVES.ROCK);
            player.incrementScore();
            
            const json = player.toJSON(true);
            const restored = Player.fromJSON(json);
            
            expect(restored.id).toBe(player.id);
            expect(restored.name).toBe(player.name);
            expect(restored.score).toBe(player.score);
            expect(restored.currentMove).toBe(player.currentMove);
            expect(restored.isReady).toBe(player.isReady);
            expect(restored.moveHistory).toHaveLength(1);
            expect(restored.statistics.totalWins).toBe(1);
        });
    });

    describe('Validation', () => {
        test('should validate correct player data', () => {
            expect(player.isValid()).toBe(true);
        });

        test('should detect invalid player data', () => {
            player.id = '';
            expect(player.isValid()).toBe(false);
            
            player.id = 'valid-id';
            player.score = -1;
            expect(player.isValid()).toBe(false);
            
            player.score = 0;
            player.currentMove = 'invalid-move';
            expect(player.isValid()).toBe(false);
        });
    });
});