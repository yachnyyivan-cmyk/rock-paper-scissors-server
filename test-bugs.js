/**
 * Manual test script to verify bug fixes
 */

const AIEngine = require('./shared/AIEngine.js');
const { MOVES } = require('./shared/gameUtils.js');

console.log('=== Testing Bug Fixes ===\n');

// Test 1: Verify AI uses AIEngine patterns properly
console.log('Test 1: Verify AI pattern usage');
console.log('Creating AIEngine with medium difficulty...');

const aiEngine = new AIEngine('medium');

// Simulate player making repeated moves to create patterns
const playerMoves = [
    MOVES.ROCK, MOVES.PAPER, MOVES.ROCK, MOVES.PAPER, 
    MOVES.ROCK, MOVES.PAPER, MOVES.ROCK, MOVES.PAPER
];

console.log('Player moves:', playerMoves.join(', '));

// Record moves
for (const move of playerMoves) {
    aiEngine.recordPlayerMove(move);
}

console.log('\nAIEngine patterns after recording:');
console.log('- Frequencies:', Array.from(aiEngine.patterns.frequencies.entries()));
console.log('- Sequences:', Array.from(aiEngine.patterns.sequences.entries()));
console.log('- Last moves:', aiEngine.patterns.lastMoves);

// Make AI predictions
console.log('\nAI predictions (next 5 moves):');
for (let i = 0; i < 5; i++) {
    const aiMove = aiEngine.makeMove();
    console.log(`  ${i + 1}. AI chose: ${aiMove}`);
    
    // Record a new player move to continue the pattern
    const nextPlayerMove = i % 2 === 0 ? MOVES.ROCK : MOVES.PAPER;
    aiEngine.recordPlayerMove(nextPlayerMove);
}

console.log('\n✓ Test 1 completed\n');

// Test 2: Verify Hard AI uses advanced strategies
console.log('Test 2: Verify Hard AI pattern usage');
const hardAI = new AIEngine('hard');

const complexPattern = [
    MOVES.ROCK, MOVES.ROCK, MOVES.PAPER,
    MOVES.ROCK, MOVES.ROCK, MOVES.PAPER,
    MOVES.ROCK, MOVES.ROCK, MOVES.PAPER,
];

console.log('Player moves (complex pattern):', complexPattern.join(', '));

for (const move of complexPattern) {
    hardAI.recordPlayerMove(move);
}

console.log('\nHard AI patterns:');
console.log('- Frequencies:', Array.from(hardAI.patterns.frequencies.entries()));
console.log('- Sequences (2-move):', 
    Array.from(hardAI.patterns.sequences.entries()).filter(([k,v]) => k.length === 2));
console.log('- Sequences (3-move):', 
    Array.from(hardAI.patterns.sequences.entries()).filter(([k,v]) => k.length === 3));

console.log('\nHard AI predictions (next 5 moves):');
for (let i = 0; i < 5; i++) {
    const aiMove = hardAI.makeMove();
    console.log(`  ${i + 1}. Hard AI chose: ${aiMove}`);
    hardAI.recordPlayerMove(MOVES.ROCK);
}

console.log('\n✓ Test 2 completed\n');

console.log('=== All Tests Completed ===');
console.log('\nNOTE: The move button fix requires browser testing.');
console.log('Open the game and test:');
console.log('1. Start a game in Hard or Medium mode');
console.log('2. Verify you can click Rock/Paper/Scissors in the FIRST round');
console.log('3. Play multiple rounds and verify AI adapts to your patterns\n');
