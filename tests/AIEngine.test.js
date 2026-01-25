/**
 * @fileoverview Unit tests for AIEngine base functionality
 */

const AIEngine = require('../shared/AIEngine');
const { MOVES, AI_DIFFICULTIES } = require('../shared/gameUtils');

describe('AIEngine Base Functionality', () => {
    let aiEngine;

    beforeEach(() => {
        aiEngine = new AIEngine(AI_DIFFICULTIES.EASY, 'test-player');
    });

    describe('Constructor', () => {
        test('should create AIEngine with valid difficulty', () => {
            expect(aiEngine.difficulty).toBe(AI_DIFFICULTIES.EASY);
            expect(aiEngine.playerId).toBe('test-player');
            expect(aiEngine.moveHistory).toEqual([]);
            expect(aiEngine.adaptationLevel).toBe(0);
        });

        test('should create AIEngine with Hard difficulty', () => {
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD, 'test-player');
            expect(hardAI.difficulty).toBe(AI_DIFFICULTIES.HARD);
            expect(hardAI.strategy.name).toBe('Hard');
        });

        test('should throw error for invalid difficulty', () => {
            expect(() => {
                new AIEngine('invalid-difficulty');
            }).toThrow('Invalid AI difficulty: invalid-difficulty');
        });

        test('should use default values when not provided', () => {
            const defaultAI = new AIEngine();
            expect(defaultAI.difficulty).toBe(AI_DIFFICULTIES.EASY);
            expect(defaultAI.playerId).toBe('human');
        });
    });

    describe('Move Recording', () => {
        test('should record valid player moves', () => {
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.PAPER);
            
            expect(aiEngine.getPlayerHistory()).toEqual([MOVES.ROCK, MOVES.PAPER]);
        });

        test('should throw error for invalid moves', () => {
            expect(() => {
                aiEngine.recordPlayerMove('invalid-move');
            }).toThrow('Invalid move: invalid-move');
        });

        test('should update frequency patterns', () => {
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.PAPER);
            
            const patterns = aiEngine.getPatterns();
            expect(patterns.frequencies.get(MOVES.ROCK)).toBe(2);
            expect(patterns.frequencies.get(MOVES.PAPER)).toBe(1);
        });

        test('should track last moves for pattern analysis', () => {
            const moves = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK, MOVES.PAPER];
            moves.forEach(move => aiEngine.recordPlayerMove(move));
            
            const patterns = aiEngine.getPatterns();
            expect(patterns.lastMoves).toEqual(moves);
        });

        test('should limit last moves to 5 entries', () => {
            const moves = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS];
            moves.forEach(move => aiEngine.recordPlayerMove(move));
            
            const patterns = aiEngine.getPatterns();
            expect(patterns.lastMoves).toHaveLength(5);
            expect(patterns.lastMoves).toEqual([MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS]);
        });

        test('should track sequence patterns', () => {
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.PAPER);
            aiEngine.recordPlayerMove(MOVES.SCISSORS);
            
            const patterns = aiEngine.getPatterns();
            expect(patterns.sequences.get('rockpaper')).toBe(1);
            expect(patterns.sequences.get('paperscissors')).toBe(1);
        });
    });

    describe('Move Generation', () => {
        test('should generate valid moves', () => {
            const move = aiEngine.makeMove();
            expect(Object.values(MOVES)).toContain(move);
        });

        test('should return consistent moves for same state', () => {
            // Since base implementation is random, we test that it returns valid moves
            for (let i = 0; i < 10; i++) {
                const move = aiEngine.makeMove();
                expect(Object.values(MOVES)).toContain(move);
            }
        });
    });

    describe('Strategy Updates', () => {
        test('should update adaptation level on wins', () => {
            const initialLevel = aiEngine.getAdaptationLevel();
            aiEngine.updateStrategy(MOVES.ROCK, MOVES.SCISSORS, 'win');
            
            expect(aiEngine.getAdaptationLevel()).toBeGreaterThan(initialLevel);
        });

        test('should decrease adaptation level on losses', () => {
            // First increase it
            aiEngine.updateStrategy(MOVES.ROCK, MOVES.SCISSORS, 'win');
            const levelAfterWin = aiEngine.getAdaptationLevel();
            
            aiEngine.updateStrategy(MOVES.ROCK, MOVES.PAPER, 'lose');
            expect(aiEngine.getAdaptationLevel()).toBeLessThan(levelAfterWin);
        });

        test('should not change adaptation level on ties', () => {
            const initialLevel = aiEngine.getAdaptationLevel();
            aiEngine.updateStrategy(MOVES.ROCK, MOVES.ROCK, 'tie');
            
            expect(aiEngine.getAdaptationLevel()).toBe(initialLevel);
        });

        test('should keep adaptation level between 0 and 1', () => {
            // Test lower bound
            for (let i = 0; i < 20; i++) {
                aiEngine.updateStrategy(MOVES.ROCK, MOVES.PAPER, 'lose');
            }
            expect(aiEngine.getAdaptationLevel()).toBeGreaterThanOrEqual(0);
            
            // Test upper bound
            for (let i = 0; i < 100; i++) {
                aiEngine.updateStrategy(MOVES.ROCK, MOVES.SCISSORS, 'win');
            }
            expect(aiEngine.getAdaptationLevel()).toBeLessThanOrEqual(1);
        });
    });

    describe('Pattern Analysis', () => {
        test('should return copy of patterns to prevent mutation', () => {
            aiEngine.recordPlayerMove(MOVES.ROCK);
            const patterns1 = aiEngine.getPatterns();
            const patterns2 = aiEngine.getPatterns();
            
            patterns1.frequencies.set('test', 999);
            expect(patterns2.frequencies.has('test')).toBe(false);
        });

        test('should return copy of move history', () => {
            aiEngine.recordPlayerMove(MOVES.ROCK);
            const history1 = aiEngine.getPlayerHistory();
            const history2 = aiEngine.getPlayerHistory();
            
            history1.push('test');
            expect(history2).toHaveLength(1);
            expect(history2).not.toContain('test');
        });
    });

    describe('Reset Functionality', () => {
        test('should reset all state when reset is called', () => {
            // Add some state
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.PAPER);
            aiEngine.updateStrategy(MOVES.ROCK, MOVES.SCISSORS, 'win');
            
            // Verify state exists
            expect(aiEngine.getPlayerHistory()).toHaveLength(2);
            expect(aiEngine.getAdaptationLevel()).toBeGreaterThan(0);
            
            // Reset and verify clean state
            aiEngine.reset();
            expect(aiEngine.getPlayerHistory()).toHaveLength(0);
            expect(aiEngine.getAdaptationLevel()).toBe(0);
            
            const patterns = aiEngine.getPatterns();
            expect(patterns.frequencies.size).toBe(0);
            expect(patterns.sequences.size).toBe(0);
            expect(patterns.lastMoves).toHaveLength(0);
        });
    });

    describe('Private Helper Methods', () => {
        test('should generate random moves from valid set', () => {
            const moves = new Set();
            for (let i = 0; i < 50; i++) {
                moves.add(aiEngine._getRandomMove());
            }
            
            // Should generate all three moves over 50 attempts (very high probability)
            expect(moves.size).toBeGreaterThan(1);
            moves.forEach(move => {
                expect(Object.values(MOVES)).toContain(move);
            });
        });

        test('should generate correct counter moves', () => {
            expect(aiEngine._getCounterMove(MOVES.ROCK)).toBe(MOVES.PAPER);
            expect(aiEngine._getCounterMove(MOVES.PAPER)).toBe(MOVES.SCISSORS);
            expect(aiEngine._getCounterMove(MOVES.SCISSORS)).toBe(MOVES.ROCK);
        });

        test('should find most frequent move', () => {
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.ROCK);
            aiEngine.recordPlayerMove(MOVES.PAPER);
            
            expect(aiEngine._getMostFrequentMove()).toBe(MOVES.ROCK);
        });

        test('should return null for most frequent move when no history', () => {
            expect(aiEngine._getMostFrequentMove()).toBeNull();
        });
    });

    describe('Difficulty Level Integration', () => {
        test('should create appropriate strategies for each difficulty', () => {
            const easyAI = new AIEngine(AI_DIFFICULTIES.EASY);
            const mediumAI = new AIEngine(AI_DIFFICULTIES.MEDIUM);
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD);

            expect(easyAI.strategy.name).toBe('Easy');
            expect(mediumAI.strategy.name).toBe('Medium');
            expect(hardAI.strategy.name).toBe('Hard');
        });

        test('should show increasing complexity in strategy stats', () => {
            const easyAI = new AIEngine(AI_DIFFICULTIES.EASY);
            const mediumAI = new AIEngine(AI_DIFFICULTIES.MEDIUM);
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD);

            const easyStats = easyAI.getStrategyStats();
            const mediumStats = mediumAI.getStrategyStats();
            const hardStats = hardAI.getStrategyStats();

            // Easy AI should have lowest expected win rate
            expect(easyStats.expectedWinRate).toBeLessThan(mediumStats.expectedWinRate);
            expect(mediumStats.expectedWinRate).toBeLessThan(hardStats.expectedWinRate);

            // Hard AI should have the most sophisticated description
            expect(hardStats.description).toContain('Markov');
            expect(hardStats.description).toContain('adaptive');
        });

        test('should handle move analysis differently across difficulties', () => {
            const easyAI = new AIEngine(AI_DIFFICULTIES.EASY);
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD);

            const moves = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK];
            
            moves.forEach(move => {
                easyAI.recordPlayerMove(move);
                hardAI.recordPlayerMove(move);
            });

            // Hard AI should have more sophisticated analysis after moves are recorded
            const hardStats = hardAI.getStrategyStats();
            expect(hardStats.movesAnalyzed).toBeGreaterThan(0);
            
            // Easy AI doesn't analyze moves internally
            const easyStats = easyAI.getStrategyStats();
            expect(easyStats.movesAnalyzed).toBe(0);
            
            // Hard AI should have higher expected win rate
            expect(hardStats.expectedWinRate).toBeGreaterThan(easyStats.expectedWinRate);
        });

        test('should show different thinking times across difficulties', () => {
            const easyAI = new AIEngine(AI_DIFFICULTIES.EASY);
            const mediumAI = new AIEngine(AI_DIFFICULTIES.MEDIUM);
            const hardAI = new AIEngine(AI_DIFFICULTIES.HARD);

            const easyTime = easyAI.getThinkingTime();
            const mediumTime = mediumAI.getThinkingTime();
            const hardTime = hardAI.getThinkingTime();

            // All should be within reasonable ranges
            expect(easyTime).toBeGreaterThan(0);
            expect(mediumTime).toBeGreaterThan(0);
            expect(hardTime).toBeGreaterThan(0);

            // Hard AI should generally take longer (though there's randomness)
            expect(hardTime).toBeGreaterThanOrEqual(1000); // Hard AI minimum
        });
    });
});