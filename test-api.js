#!/usr/bin/env node
/**
 * API Integration Test
 * Tests all authentication and stats endpoints
 */

const http = require('http');
const GameServer = require('./server/server');

// Start the server
console.log('Starting test server...\n');
const gameServer = new GameServer();

let port = 3001; // Use different port to avoid conflicts
const server = gameServer.server.listen(port, () => {
    console.log(`✓ Test server running on port ${port}\n`);
    runTests();
});

let testsPassed = 0;
let testsFailed = 0;
let userId = null;

async function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

function test(name, passed, expected, actual) {
    if (passed) {
        console.log(`✓ ${name}`);
        testsPassed++;
    } else {
        console.log(`✗ ${name}`);
        console.log(`  Expected: ${expected}`);
        console.log(`  Actual: ${actual}`);
        testsFailed++;
    }
}

async function runTests() {
    console.log('=== AUTHENTICATION API TESTS ===\n');

    try {
        // Test 1: Register user
        console.log('Test 1: Register user');
        const regRes = await request('POST', '/api/auth/register', {
            username: 'testuser',
            password: 'password123',
            confirmPassword: 'password123'
        });
        test('Register success', regRes.status === 200 && regRes.data.success, '200, success: true', `${regRes.status}, success: ${regRes.data.success}`);
        userId = regRes.data.user?.id;

        // Test 2: Duplicate username
        console.log('\nTest 2: Duplicate username');
        const dupRes = await request('POST', '/api/auth/register', {
            username: 'testuser',
            password: 'password123',
            confirmPassword: 'password123'
        });
        test('Reject duplicate', dupRes.status === 400, '400', dupRes.status);

        // Test 3: Login
        console.log('\nTest 3: Login');
        const loginRes = await request('POST', '/api/auth/login', {
            username: 'testuser',
            password: 'password123'
        });
        test('Login success', loginRes.status === 200 && loginRes.data.success, '200, success: true', `${loginRes.status}, success: ${loginRes.data.success}`);

        // Test 4: Wrong password
        console.log('\nTest 4: Wrong password');
        const wrongRes = await request('POST', '/api/auth/login', {
            username: 'testuser',
            password: 'wrongpassword'
        });
        test('Reject wrong password', wrongRes.status === 401, '401', wrongRes.status);

        // Test 5: Get user
        console.log('\nTest 5: Get user');
        const getUserRes = await request('GET', `/api/users/${userId}`);
        test('Get user success', getUserRes.status === 200 && getUserRes.data.username === 'testuser', '200, username: testuser', `${getUserRes.status}, username: ${getUserRes.data.username}`);

        // Test 6: Add SP points
        console.log('\nTest 6: Add single-player points');
        const addSpRes = await request('POST', `/api/users/${userId}/sp-points`, { points: 5 });
        test('Add SP points', addSpRes.status === 200 && addSpRes.data.user.spPoints === 5, '200, spPoints: 5', `${addSpRes.status}, spPoints: ${addSpRes.data.user.spPoints}`);

        // Test 7: Add MP score
        console.log('\nTest 7: Add multiplayer score');
        const addMpRes = await request('POST', `/api/users/${userId}/mp-score`, { points: 10 });
        test('Add MP score', addMpRes.status === 200 && addMpRes.data.user.mpScore === 10, '200, mpScore: 10', `${addMpRes.status}, mpScore: ${addMpRes.data.user.mpScore}`);

        // Test 8: Update stats
        console.log('\nTest 8: Update stats');
        const updateRes = await request('PUT', `/api/users/${userId}/stats`, {
            spPoints: 15,
            mpScore: 20
        });
        test('Update stats', updateRes.status === 200 && updateRes.data.user.spPoints === 15, '200, spPoints: 15', `${updateRes.status}, spPoints: ${updateRes.data.user.spPoints}`);

        // Test 9: Get leaderboard
        console.log('\nTest 9: Get leaderboard');
        const leaderboardRes = await request('GET', '/api/leaderboard?type=sp');
        test('Get leaderboard', leaderboardRes.status === 200 && Array.isArray(leaderboardRes.data.leaderboard), '200, array', `${leaderboardRes.status}, ${typeof leaderboardRes.data.leaderboard}`);

        // Test 10: Get user rank
        console.log('\nTest 10: Get user rank');
        const rankRes = await request('GET', `/api/users/${userId}/rank?type=sp`);
        test('Get user rank', rankRes.status === 200 && rankRes.data.rank?.username === 'testuser', '200, user rank', `${rankRes.status}, rank: ${rankRes.data.rank?.rank}`);

    } catch (error) {
        console.error('Test error:', error);
    }

    // Summary
    console.log(`\n=== SUMMARY ===`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);

    // Close server and exit
    server.close(() => {
        console.log('\n✓ Test server closed');
        process.exit(testsFailed > 0 ? 1 : 0);
    });
}
