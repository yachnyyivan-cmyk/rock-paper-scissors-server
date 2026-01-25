/**
 * @fileoverview Unit tests for Easy AI Strategy
 */

const EasyAIStrategy = require('../shared/strategies/EasyAIStrategy');
const { MOVES } = require('../shared/gameUtils');

describe('EasyAIStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new EasyAIStrategy();
    });

    describe('Constructor', () => {
        test('should initialize with correct properties', () => {
            expect(strategy.name).toBe('Easy');
            expect(strategy.description).toBe('Random move selection with no strategy');
            expect(strategy.thinkingTimeMin).toBe(500);
            expect(strategy.thinkingTimeMax).toBe(1500);
        });
    });

    describe('Move Generation', () => {
        test('should generate valid moves', () => {
            for (let i = 0; i < 20; i++) {
                const move = strategy.makeMove([], {});
                expect(Object.values(MOVES)).toContain(move);
            }
        });

        test('should ignore move history and patterns', () => {
            const moveHistory = [MOVES.ROCK, MOVES.ROCK, MOVES.ROCK];
            const patterns = {
                frequencies: new Map([[MOVES.ROCK, 3]]),
                sequences: new Map([['rockrock', 2]]),
                lastMoves: [MOVES.ROCK, MOVES.ROCK, MOVES.ROCK]
            };

            // Should still generate random moves regardless of patterns
            const moves = new Set();
            for (let i = 0; i < 50; i++) {
                moves.add(strategy.makeMove(moveHistory, patterns));
            }

            // Should generate multiple different moves (very high probability)
            expect(moves.size).toBeGreaterThan(1);
        });

        test('should have roughly equal distribution over many moves', () => {
            const moveCount = { rock: 0, paper: 0, scissors: 0 };
            const totalMoves = 300;

            for (let i = 0; i < totalMoves; i++) {
                const move = strategy.makeMove([], {});
                moveCount[move]++;
            }

            // Each move should appear roughly 1/3 of the time (within reasonable variance)
            const expectedCount = totalMoves / 3;
            const tolerance = expectedCount * 0.2; // 20% tolerance

            expect(moveCount.rock).toBeGreaterThan(expectedCount - tolerance);
            expect(moveCount.rock).toBeLessThan(expectedCount + tolerance);
            expect(moveCount.paper).toBeGreaterThan(expectedCount - tolerance);
            expect(moveCount.paper).toBeLessThan(expectedCount + tolerance);
            expect(moveCount.scissors).toBeGreaterThan(expectedCount - tolerance);
            expect(moveCount.scissors).toBeLessThan(expectedCount + tolerance);
        });
    });

    describe('Analysis Methods', () => {
        test('should not throw when analyzing moves', () => {
            expect(() => {
                strategy.analyzeMove(MOVES.ROCK, [MOVES.ROCK]);
            }).not.toThrow();
        });

        test('should not throw when updating strategy', () => {
            expect(() => {
                strategy.updateStrategy(MOVES.ROCK, MOVES.PAPER, 'lose', {});
            }).not.toThrow();
        });
    });

    describe('Thinking Time', () => {
        test('should return thinking time within specified range', () => {
            for (let i = 0; i < 10; i++) {
                const thinkingTime = strategy.getThinkingTime();
                expect(thinkingTime).toBeGreaterThanOrEqual(500);
                expect(thinkingTime).toBeLessThanOrEqual(1500);
            }
        });

        test('should return different thinking times', () => {
            const times = new Set();
            for (let i = 0; i < 20; i++) {
                times.add(strategy.getThinkingTime());
            }
            
            // Should generate multiple different times (very high probability)
            expect(times.size).toBeGreaterThan(1);
        });
    });

    describe('Statistics', () => {
        test('should return correct stats', () => {
            const stats = strategy.getStats();
            
            expect(stats.name).toBe('Easy');
            expect(stats.description).toBe('Random move selection with no strategy');
            expect(stats.adaptationLevel).toBe(0);
            expect(stats.movesAnalyzed).toBe(0);
            expect(stats.expectedWinRate).toBe(0.33);
        });
    });

    describe('Reset', () => {
        test('should not throw when reset is called', () => {
            expect(() => {
                strategy.reset();
            }).not.toThrow();
        });

        test('should maintain same behavior after reset', () => {
            const moveBefore = strategy.makeMove([], {});
            strategy.reset();
            const moveAfter = strategy.makeMove([], {});
            
            // Both should be valid moves (behavior unchanged)
            expect(Object.values(MOVES)).toContain(moveBefore);
            expect(Object.values(MOVES)).toContain(moveAfter);
        });
    });

    describe('Integration with AIEngine', () => {
        test('should work as a strategy object', () => {
            // Test that it has all required methods for strategy pattern
            expect(typeof strategy.makeMove).toBe('function');
            expect(typeof strategy.analyzeMove).toBe('function');
            expect(typeof strategy.updateStrategy).toBe('function');
            expect(typeof strategy.getThinkingTime).toBe('function');
            expect(typeof strategy.getStats).toBe('function');
            expect(typeof strategy.reset).toBe('function');
        });
    });
});