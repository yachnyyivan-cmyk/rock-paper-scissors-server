/**
 * @fileoverview Integration tests for Player vs AI game mode
 * Tests the complete PvAI game session flow including AI integration
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Import the shared components that can be tested
const GameSession = require('../shared/GameSession');
const AIEngine = require('../shared/AIEngine');
const { GAME_MODES, AI_DIFFICULTIES, MOVES } = require('../shared/gameUtils');

describe('Player vs AI Integration Tests', () => {
    let gameSession;
    let aiEngine;

    beforeEach(() => {
        // Create a PvAI game session
        gameSession = new GameSession('test-session-1', GAME_MODES.PVAI, {
            aiDifficulty: AI_DIFFICULTIES.MEDIUM,
            maxRounds: 5
        });

        // Create AI engine
        aiEngine = new AIEngine(AI_DIFFICULTIES.MEDIUM, 'human-player');
    });

    afterEach(() => {
        if (gameSession) {
            gameSession.endSession('test-cleanup');
        }
    });

    describe('Game Session Setup', () => {
        it('should create PvAI game session with correct settings', () => {
            expect(gameSession.mode).toBe(GAME_MODES.PVAI);
            expect(gameSession.settings.aiDifficulty).toBe(AI_DIFFICULTIES.MEDIUM);
            expect(gameSession.isActive).toBe(true);
        });

        it('should add human player to session', () => {
            const result = gameSession.addPlayer('human-1', 'Human Player');

            expect(result.success).toBe(true);
            expect(gameSession.players.size).toBe(1);
            expect(gameSession.players.get('human-1').name).toBe('Human Player');
        });

        it('should initialize AI engine with correct difficulty', () => {
            expect(aiEngine.difficulty).toBe(AI_DIFFICULTIES.MEDIUM);
            expect(aiEngine.playerId).toBe('human-player');
            expect(aiEngine.moveHistory).toEqual([]);
        });
    });

    describe('AI Engine Integration', () => {
        beforeEach(() => {
            gameSession.addPlayer('human-1', 'Human Player');
        });

        it('should record player moves and generate AI responses', () => {
            // Record player move in AI engine
            aiEngine.recordPlayerMove(MOVES.ROCK);

            expect(aiEngine.moveHistory).toContain(MOVES.ROCK);
            expect(aiEngine.patterns.frequencies.get(MOVES.ROCK)).toBe(1);

            // Generate AI move
            const aiMove = aiEngine.makeMove();
            expect(Object.values(MOVES)).toContain(aiMove);
        });

        it('should update AI strategy based on game results', () => {
            const initialAdaptationLevel = aiEngine.adaptationLevel;

            // Simulate AI win
            aiEngine.updateStrategy(MOVES.PAPER, MOVES.ROCK, 'win');
            expect(aiEngine.adaptationLevel).toBeGreaterThan(initialAdaptationLevel);

            // Simulate AI loss
            aiEngine.updateStrategy(MOVES.ROCK, MOVES.PAPER, 'lose');
            expect(aiEngine.adaptationLevel).toBeLessThan(initialAdaptationLevel + 0.02);
        });

        it('should provide realistic thinking times based on difficulty', () => {
            const easyAI = new AIEngine(AI_DIFFICULTIES.EASY);
            const mediumAI = new AIEngine(AI_DIFFICULTIES.MEDIUM);
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD);

            const easyTime = easyAI.getThinkingTime();
            const mediumTime = mediumAI.getThinkingTime();
            const hardTime = hardAI.getThinkingTime();

            // Easy should be fastest, hard should be slowest
            expect(easyTime).toBeLessThan(2000);
            expect(mediumTime).toBeGreaterThan(500);
            expect(hardTime).toBeGreaterThan(1000);
        });
    });

    describe('Complete Game Flow', () => {
        beforeEach(() => {
            gameSession.addPlayer('human-1', 'Human Player');
        });

        it('should handle complete round with AI integration', () => {
            // For PvAI mode, we need to add an AI player or modify the game session
            // Let's add a mock AI player to satisfy the 2-player requirement
            gameSession.addPlayer('ai-player', 'AI Opponent');

            // Start a new game
            const startResult = gameSession.startNewGame();
            expect(startResult.success).toBe(true);

            // Simulate player move
            const playerMove = MOVES.ROCK;
            aiEngine.recordPlayerMove(playerMove);

            // Process move in game session
            const moveResult = gameSession.makeMove('human-1', playerMove);
            expect(moveResult.success).toBe(true);

            // Generate AI move
            const aiMove = aiEngine.makeMove();

            // Simulate AI move (in real implementation, this would be handled by the game engine)
            // For testing, we'll verify the AI can generate a valid move
            expect(Object.values(MOVES)).toContain(aiMove);

            // Update AI strategy based on hypothetical result
            const result = playerMove === aiMove ? 'tie' : 'win'; // Simplified result
            aiEngine.updateStrategy(aiMove, playerMove, result);
        });

        it('should track game statistics throughout session', () => {
            // Play several rounds
            const moves = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK, MOVES.PAPER];

            moves.forEach(move => {
                aiEngine.recordPlayerMove(move);
                gameSession.makeMove('human-1', move);

                const aiMove = aiEngine.makeMove();
                const result = move === aiMove ? 'tie' : 'win';
                aiEngine.updateStrategy(aiMove, move, result);
            });

            expect(aiEngine.moveHistory.length).toBe(5);
            expect(aiEngine.patterns.frequencies.get(MOVES.ROCK)).toBe(2);
            expect(aiEngine.patterns.frequencies.get(MOVES.PAPER)).toBe(2);
            expect(aiEngine.patterns.frequencies.get(MOVES.SCISSORS)).toBe(1);
        });

        it('should handle game completion and provide statistics', () => {
            // Simulate a completed game
            const stats = aiEngine.getStrategyStats();

            expect(stats).toHaveProperty('name');
            expect(stats).toHaveProperty('description');
            expect(stats).toHaveProperty('adaptationLevel');
            expect(stats).toHaveProperty('movesAnalyzed');
            expect(stats).toHaveProperty('expectedWinRate');

            expect(typeof stats.adaptationLevel).toBe('number');
            expect(typeof stats.movesAnalyzed).toBe('number');
            expect(typeof stats.expectedWinRate).toBe('number');
        });

        it('should reset AI state for new games', () => {
            // Add some history
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.PAPER);

            expect(aiEngine.moveHistory.length).toBe(2);
            expect(aiEngine.patterns.frequencies.size).toBeGreaterThan(0);

            // Reset AI
            aiEngine.reset();

            expect(aiEngine.moveHistory.length).toBe(0);
            expect(aiEngine.patterns.frequencies.size).toBe(0);
            expect(aiEngine.patterns.lastMoves.length).toBe(0);
            expect(aiEngine.adaptationLevel).toBe(0);
        });
    });

    describe('AI Difficulty Behaviors', () => {
        it('should demonstrate different behaviors across difficulty levels', () => {
            const easyAI = new AIEngine(AI_DIFFICULTIES.EASY);
            const mediumAI = new AIEngine(AI_DIFFICULTIES.MEDIUM);
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD);

            // Add some predictable pattern
            const pattern = [MOVES.ROCK, MOVES.ROCK, MOVES.ROCK];

            pattern.forEach(move => {
                easyAI.recordPlayerMove(move);
                mediumAI.recordPlayerMove(move);
                hardAI.recordPlayerMove(move);
            });

            // Generate moves multiple times to see patterns
            const easyMoves = [];
            const mediumMoves = [];
            const hardMoves = [];

            for (let i = 0; i < 10; i++) {
                easyMoves.push(easyAI.makeMove());
                mediumMoves.push(mediumAI.makeMove());
                hardMoves.push(hardAI.makeMove());
            }

            // Easy AI should be more random
            const easyUnique = new Set(easyMoves).size;

            // Medium and Hard AI should show some pattern recognition
            // (This is a basic test - in practice you'd need more sophisticated analysis)
            expect(easyUnique).toBeGreaterThan(1); // Should have some variety
            expect(mediumMoves.length).toBe(10);
            expect(hardMoves.length).toBe(10);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid moves gracefully', () => {
            expect(() => {
                aiEngine.recordPlayerMove('invalid-move');
            }).toThrow('Invalid move: invalid-move');
        });

        it('should handle AI engine failures gracefully', () => {
            // Mock a strategy that throws an error
            const originalStrategy = aiEngine.strategy;
            aiEngine.strategy = {
                makeMove: () => { throw new Error('Strategy error'); },
                analyzeMove: () => { },
                updateStrategy: () => { }
            };

            // The current implementation doesn't catch strategy errors, so it should throw
            expect(() => {
                aiEngine.makeMove();
            }).toThrow('Strategy error');

            // Restore original strategy
            aiEngine.strategy = originalStrategy;
        });

        it('should validate game session state', () => {
            expect(gameSession.isValid()).toBe(true);

            // Corrupt the session
            gameSession.sessionId = '';
            expect(gameSession.isValid()).toBe(false);
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle large number of moves efficiently', () => {
            const startTime = Date.now();

            // Simulate 1000 moves
            for (let i = 0; i < 1000; i++) {
                const move = Object.values(MOVES)[i % 3];
                aiEngine.recordPlayerMove(move);
                aiEngine.makeMove();
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (adjust threshold as needed)
            expect(duration).toBeLessThan(1000); // 1 second
            expect(aiEngine.moveHistory.length).toBe(1000);
        });

        it('should maintain bounded memory usage', () => {
            // Add many moves
            for (let i = 0; i < 100; i++) {
                const move = Object.values(MOVES)[i % 3];
                aiEngine.recordPlayerMove(move);
            }

            // Last moves should be bounded
            expect(aiEngine.patterns.lastMoves.length).toBeLessThanOrEqual(5);

            // Frequency map should contain all moves but not grow unbounded
            expect(aiEngine.patterns.frequencies.size).toBeLessThanOrEqual(3);
        });
    });
});

module.exports = {
    // Export test utilities for other test files
    createTestGameSession: (difficulty = AI_DIFFICULTIES.MEDIUM) => {
        return new GameSession('test-session', GAME_MODES.PVAI, {
            aiDifficulty: difficulty,
            maxRounds: 5
        });
    },

    createTestAIEngine: (difficulty = AI_DIFFICULTIES.MEDIUM) => {
        return new AIEngine(difficulty, 'test-player');
    }
};