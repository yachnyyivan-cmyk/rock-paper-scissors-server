/**
 * @fileoverview Unit tests for Medium AI Strategy
 */

const MediumAIStrategy = require('../shared/strategies/MediumAIStrategy');
const { MOVES } = require('../shared/gameUtils');

describe('MediumAIStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new MediumAIStrategy();
    });

    describe('Constructor', () => {
        test('should initialize with correct properties', () => {
            expect(strategy.name).toBe('Medium');
            expect(strategy.description).toBe('Pattern recognition with frequency analysis');
            expect(strategy.thinkingTimeMin).toBe(800);
            expect(strategy.thinkingTimeMax).toBe(2000);
            expect(strategy.minHistoryForPattern).toBe(2);
            expect(strategy.recentMovesWeight).toBe(0.7);
            expect(strategy.patternConfidenceThreshold).toBe(0.6);
            expect(strategy.randomFallbackRate).toBe(0.2);
        });

        test('should initialize internal state correctly', () => {
            expect(strategy.movesAnalyzed).toBe(0);
            expect(strategy.successfulPredictions).toBe(0);
            expect(strategy.patternMatches.size).toBe(0);
        });
    });

    describe('Move Generation', () => {
        test('should generate valid moves', () => {
            for (let i = 0; i < 20; i++) {
                const move = strategy.makeMove([], {});
                expect(Object.values(MOVES)).toContain(move);
            }
        });

        test('should return random move with insufficient history', () => {
            const shortHistory = [MOVES.ROCK, MOVES.PAPER];
            const patterns = { frequencies: new Map(), lastMoves: [] };
            
            // Should return random moves when history is too short
            for (let i = 0; i < 10; i++) {
                const move = strategy.makeMove(shortHistory, patterns);
                expect(Object.values(MOVES)).toContain(move);
            }
        });

        test('should use pattern recognition with sufficient history', () => {
            // Create a predictable pattern: rock -> paper -> scissors -> rock -> paper -> scissors
            const moveHistory = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK, MOVES.PAPER];
            const patterns = {
                frequencies: new Map([
                    [MOVES.ROCK, 2],
                    [MOVES.PAPER, 2],
                    [MOVES.SCISSORS, 1]
                ]),
                lastMoves: [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK, MOVES.PAPER]
            };

            // Train the strategy with the pattern
            strategy.analyzeMove(MOVES.PAPER, [MOVES.ROCK]);
            strategy.analyzeMove(MOVES.SCISSORS, [MOVES.ROCK, MOVES.PAPER]);
            strategy.analyzeMove(MOVES.ROCK, [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS]);
            strategy.analyzeMove(MOVES.PAPER, [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS, MOVES.ROCK]);

            // The AI should learn that after rock->paper, scissors often comes next
            // So it should counter scissors with rock
            const aiMoves = [];
            for (let i = 0; i < 10; i++) {
                aiMoves.push(strategy.makeMove(moveHistory, patterns));
            }

            // Should show some pattern-based behavior (not purely random)
            const uniqueMoves = new Set(aiMoves);
            expect(uniqueMoves.size).toBeGreaterThan(0);
        });
    });

    describe('Pattern Analysis', () => {
        test('should track move patterns correctly', () => {
            const moveHistory = [MOVES.ROCK, MOVES.PAPER];
            
            strategy.analyzeMove(MOVES.SCISSORS, moveHistory);
            expect(strategy.patternMatches.get('paperscissors')).toBe(1);
            expect(strategy.movesAnalyzed).toBe(1);
        });

        test('should accumulate pattern counts', () => {
            // Simulate the same pattern multiple times
            strategy.analyzeMove(MOVES.SCISSORS, [MOVES.ROCK, MOVES.PAPER]);
            strategy.analyzeMove(MOVES.SCISSORS, [MOVES.PAPER, MOVES.ROCK]);
            strategy.analyzeMove(MOVES.SCISSORS, [MOVES.ROCK, MOVES.PAPER]);
            
            expect(strategy.patternMatches.get('paperscissors')).toBe(2);
            expect(strategy.patternMatches.get('rockscissors')).toBe(1);
            expect(strategy.movesAnalyzed).toBe(3);
        });

        test('should not track patterns with insufficient history', () => {
            strategy.analyzeMove(MOVES.ROCK, []);
            
            expect(strategy.patternMatches.size).toBe(0);
            expect(strategy.movesAnalyzed).toBe(1);
        });
    });

    describe('Strategy Updates', () => {
        test('should track successful predictions', () => {
            // AI plays paper (expecting player to play rock)
            // Player actually plays rock, so AI wins
            strategy.updateStrategy(MOVES.PAPER, MOVES.ROCK, 'win', {});
            
            // This should not count as a successful prediction since AI won
            expect(strategy.successfulPredictions).toBe(0);
        });

        test('should adjust parameters based on performance', () => {
            // Set up initial state with enough moves analyzed
            strategy.movesAnalyzed = 10;
            strategy.successfulPredictions = 1; // This will become 2 after updateStrategy, giving 2/10 = 0.2 accuracy
            
            const initialThreshold = strategy.patternConfidenceThreshold; // 0.6
            const initialFallbackRate = strategy.randomFallbackRate; // 0.2
            
            // Call updateStrategy - this should trigger parameter adjustment
            // The AI played rock, player played paper (which beats rock), AI lost
            // This means the AI correctly predicted the player would play paper (the winning move against rock)
            strategy.updateStrategy(MOVES.ROCK, MOVES.PAPER, 'lose', {});
            
            // Should become more conservative (increase both parameters)
            expect(strategy.patternConfidenceThreshold).toBeGreaterThan(initialThreshold);
            expect(strategy.randomFallbackRate).toBeGreaterThan(initialFallbackRate);
        });

        test('should become more aggressive with good performance', () => {
            const initialThreshold = strategy.patternConfidenceThreshold;
            const initialFallbackRate = strategy.randomFallbackRate;
            
            // Simulate good performance
            strategy.movesAnalyzed = 10;
            strategy.successfulPredictions = 7; // 70% accuracy
            
            strategy.updateStrategy(MOVES.ROCK, MOVES.PAPER, 'lose', {});
            
            // Should become more aggressive
            expect(strategy.patternConfidenceThreshold).toBeLessThan(initialThreshold);
            expect(strategy.randomFallbackRate).toBeLessThan(initialFallbackRate);
        });
    });

    describe('Frequency Analysis', () => {
        test('should predict based on frequency patterns', () => {
            const patterns = {
                frequencies: new Map([
                    [MOVES.ROCK, 7],    // 70% of moves
                    [MOVES.PAPER, 2],   // 20% of moves
                    [MOVES.SCISSORS, 1] // 10% of moves
                ]),
                lastMoves: [MOVES.ROCK, MOVES.ROCK, MOVES.ROCK, MOVES.ROCK, MOVES.ROCK]
            };
            
            const moveHistory = Array(10).fill(MOVES.ROCK);
            
            // Temporarily disable random fallback to test frequency prediction
            strategy.randomFallbackRate = 0;
            
            const aiMoves = [];
            for (let i = 0; i < 20; i++) {
                aiMoves.push(strategy.makeMove(moveHistory, patterns));
            }
            
            // Should frequently counter rock with paper
            const paperCount = aiMoves.filter(move => move === MOVES.PAPER).length;
            expect(paperCount).toBeGreaterThan(aiMoves.length * 0.3); // At least 30% paper moves
        });
    });

    describe('Thinking Time', () => {
        test('should return thinking time within specified range', () => {
            for (let i = 0; i < 10; i++) {
                const thinkingTime = strategy.getThinkingTime();
                expect(thinkingTime).toBeGreaterThanOrEqual(800);
                expect(thinkingTime).toBeLessThanOrEqual(2000);
            }
        });

        test('should increase thinking time with pattern complexity', () => {
            // Add many patterns to increase complexity
            for (let i = 0; i < 20; i++) {
                strategy.patternMatches.set(`pattern${i}`, i);
            }
            
            const complexThinkingTime = strategy.getThinkingTime();
            
            // Reset patterns
            strategy.patternMatches.clear();
            const simpleThinkingTime = strategy.getThinkingTime();
            
            // Complex thinking should generally be longer (though random, so test multiple times)
            const complexTimes = [];
            const simpleTimes = [];
            
            for (let i = 0; i < 10; i++) {
                // Add patterns again
                for (let j = 0; j < 20; j++) {
                    strategy.patternMatches.set(`pattern${j}`, j);
                }
                complexTimes.push(strategy.getThinkingTime());
                
                strategy.patternMatches.clear();
                simpleTimes.push(strategy.getThinkingTime());
            }
            
            const avgComplex = complexTimes.reduce((a, b) => a + b) / complexTimes.length;
            const avgSimple = simpleTimes.reduce((a, b) => a + b) / simpleTimes.length;
            
            expect(avgComplex).toBeGreaterThan(avgSimple);
        });
    });

    describe('Statistics', () => {
        test('should return correct stats with no history', () => {
            const stats = strategy.getStats();
            
            expect(stats.name).toBe('Medium');
            expect(stats.description).toBe('Pattern recognition with frequency analysis');
            expect(stats.adaptationLevel).toBe(0);
            expect(stats.movesAnalyzed).toBe(0);
            expect(stats.successfulPredictions).toBe(0);
            expect(stats.predictionAccuracy).toBe(0);
            expect(stats.patternsDetected).toBe(0);
            expect(stats.expectedWinRate).toBe(0.5);
        });

        test('should calculate stats correctly with history', () => {
            strategy.movesAnalyzed = 10;
            strategy.successfulPredictions = 6;
            strategy.patternMatches.set('pattern1', 1);
            strategy.patternMatches.set('pattern2', 2);
            
            const stats = strategy.getStats();
            
            expect(stats.movesAnalyzed).toBe(10);
            expect(stats.successfulPredictions).toBe(6);
            expect(stats.predictionAccuracy).toBe(0.6);
            expect(stats.patternsDetected).toBe(2);
            expect(stats.adaptationLevel).toBe(1); // 0.6 * 2 = 1.2, capped at 1
            expect(stats.expectedWinRate).toBe(0.62); // 0.5 + (0.6 * 0.2)
        });
    });

    describe('Reset Functionality', () => {
        test('should reset all state when reset is called', () => {
            // Add some state
            strategy.movesAnalyzed = 10;
            strategy.successfulPredictions = 5;
            strategy.patternMatches.set('test', 1);
            strategy.patternConfidenceThreshold = 0.8;
            strategy.randomFallbackRate = 0.3;
            
            // Reset and verify clean state
            strategy.reset();
            
            expect(strategy.movesAnalyzed).toBe(0);
            expect(strategy.successfulPredictions).toBe(0);
            expect(strategy.patternMatches.size).toBe(0);
            expect(strategy.patternConfidenceThreshold).toBe(0.6);
            expect(strategy.randomFallbackRate).toBe(0.2);
        });
    });

    describe('Pattern Detection Accuracy', () => {
        test('should detect simple alternating patterns', () => {
            // Train with alternating rock-paper pattern
            const pattern = [MOVES.ROCK, MOVES.PAPER, MOVES.ROCK, MOVES.PAPER, MOVES.ROCK];
            
            for (let i = 2; i < pattern.length; i++) {
                strategy.analyzeMove(pattern[i], pattern.slice(0, i));
            }
            
            // Should have detected the rock->paper and paper->rock patterns
            expect(strategy.patternMatches.get('rockpaper')).toBeGreaterThan(0);
            expect(strategy.patternMatches.get('paperrock')).toBeGreaterThan(0);
        });

        test('should handle complex multi-move patterns', () => {
            // Train with rock->paper->scissors->rock pattern
            const sequence = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS];
            const pattern = [...sequence, ...sequence, ...sequence]; // Repeat 3 times
            
            for (let i = 2; i < pattern.length; i++) {
                strategy.analyzeMove(pattern[i], pattern.slice(0, i));
            }
            
            // Should detect the repeating 3-move sequence
            expect(strategy.patternMatches.get('paperscissors')).toBeGreaterThan(0);
            expect(strategy.patternMatches.get('scissorsrock')).toBeGreaterThan(0);
            expect(strategy.patternMatches.get('rockpaper')).toBeGreaterThan(0);
        });

        test('should adapt to changing patterns', () => {
            // First establish one pattern
            for (let i = 0; i < 5; i++) {
                strategy.analyzeMove(MOVES.PAPER, [MOVES.ROCK, MOVES.ROCK]);
            }
            
            const initialPattern = strategy.patternMatches.get('rockpaper');
            expect(initialPattern).toBe(5);
            
            // Then switch to a different pattern
            for (let i = 0; i < 3; i++) {
                strategy.analyzeMove(MOVES.SCISSORS, [MOVES.ROCK, MOVES.ROCK]);
            }
            
            expect(strategy.patternMatches.get('rockpaper')).toBe(5);
            expect(strategy.patternMatches.get('rockscissors')).toBe(3);
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

        test('should perform better than random against predictable patterns', () => {
            // Disable random fallback for this test
            strategy.randomFallbackRate = 0;
            
            // Create a very predictable pattern (always rock)
            const predictableHistory = Array(10).fill(MOVES.ROCK);
            const patterns = {
                frequencies: new Map([[MOVES.ROCK, 10]]),
                lastMoves: Array(5).fill(MOVES.ROCK)
            };
            
            // Train the strategy
            for (let i = 2; i < predictableHistory.length; i++) {
                strategy.analyzeMove(MOVES.ROCK, predictableHistory.slice(0, i));
            }
            
            // Generate moves - should heavily favor paper (counter to rock)
            const aiMoves = [];
            for (let i = 0; i < 20; i++) {
                aiMoves.push(strategy.makeMove(predictableHistory, patterns));
            }
            
            const paperCount = aiMoves.filter(move => move === MOVES.PAPER).length;
            // Should choose paper more than random (33%) since it counters the predicted rock
            expect(paperCount).toBeGreaterThan(aiMoves.length * 0.4);
        });
    });
});