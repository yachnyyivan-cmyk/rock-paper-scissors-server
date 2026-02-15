#!/usr/bin/env node
/**
 * Test script for authentication system
 */

const User = require('./server/User');
const UserManager = require('./server/UserManager');

console.log('=== Testing User Authentication System ===\n');

// Create user manager
const userManager = new UserManager();

// Test 1: Register users
console.log('Test 1: Registering users');
const reg1 = userManager.register('alice', 'password123');
console.log('  Register alice:', reg1.success ? '✓ Success' : '✗ Failed - ' + reg1.error);

const reg2 = userManager.register('bob', 'secret456');
console.log('  Register bob:', reg2.success ? '✓ Success' : '✗ Failed - ' + reg2.error);

// Test 2: Try duplicate username
console.log('\nTest 2: Duplicate username validation');
const reg3 = userManager.register('alice', 'different');
console.log('  Duplicate alice:', !reg3.success ? '✓ Correctly rejected' : '✗ Should have failed');

// Test 3: Login with correct credentials
console.log('\nTest 3: Login with correct credentials');
const login1 = userManager.login('alice', 'password123');
console.log('  Login alice:', login1.success ? '✓ Success' : '✗ Failed - ' + login1.error);

// Test 4: Login with wrong password
console.log('\nTest 4: Login with wrong password');
const login2 = userManager.login('alice', 'wrongpassword');
console.log('  Wrong password:', !login2.success ? '✓ Correctly rejected' : '✗ Should have failed');

// Test 5: Add points
console.log('\nTest 5: Adding points');
const userId = reg1.user.id;
const addPoints = userManager.addSpPoints(userId, 5);
console.log('  Add 5 SP points:', addPoints.success ? `✓ Success (total: ${addPoints.user.spPoints})` : '✗ Failed');

// Test 6: Add multiplayer score
console.log('\nTest 6: Adding multiplayer score');
const addMp = userManager.addMpScore(userId, 10);
console.log('  Add 10 MP score:', addMp.success ? `✓ Success (total: ${addMp.user.mpScore})` : '✗ Failed');

// Test 7: Leaderboard
console.log('\nTest 7: Leaderboard');
userManager.addSpPoints(reg2.user.id, 3); // Add some points to bob
const leaderboard = userManager.getLeaderboard('sp', 10);
console.log(`  SP Leaderboard (${leaderboard.length} users):`);
leaderboard.forEach(u => {
    console.log(`    #${u.rank} ${u.username}: ${u.spPoints} points`);
});

// Test 8: User rank
console.log('\nTest 8: User rank');
const aliceRank = userManager.getUserRank(userId, 'sp');
console.log(`  Alice rank (SP):`, aliceRank ? `✓ #${aliceRank.rank}` : '✗ Failed');

console.log('\n=== All tests completed ===');
