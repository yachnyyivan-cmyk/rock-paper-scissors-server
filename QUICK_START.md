# Quick Start: Using the New Authentication & Points System

## For End Users

### First Launch
1. Download: `Rock Paper Scissors-1.0.0.AppImage`
2. Make executable: `chmod +x "Rock Paper Scissors-1.0.0.AppImage"`
3. Run it: `./Rock\ Paper\ Scissors-1.0.0.AppImage`
4. You'll see the login screen

### Create Your Account
1. Click "Create Account" at the bottom of the login form
2. Enter a username (3-20 characters)
3. Enter a password (minimum 6 characters)
4. Click "Register"
5. You'll see a success message
6. Return to login form
7. Enter your credentials and click "Login"

### Playing Games & Earning Points

#### Single-Player (vs AI)
1. From dashboard, click "Play Game"
2. Select "Player vs AI"
3. Choose difficulty:
   - Easy: 1 point per win
   - Medium: 3 points per win
   - Hard: 5 points per win
4. Win the best-of-3 match
5. Points automatically added to your account
6. Return to dashboard to see updated points

#### Multiplayer (vs Player)
1. From dashboard, click "Play Game"
2. Select "Player vs Player"
3. Create room or join with code
4. Wait for opponent
5. Play the match
6. Win: +10 points | Loss: -10 points
7. Points automatically added
8. Return to lobby or dashboard

### Tracking Progress
1. Check dashboard for current stats
2. Click "Leaderboard" to see rankings
3. Find yourself in the list
4. See your current rank

### Example Session

```
Launch App
↓
Login Screen Appears
  Enter username: alice
  Enter password: ••••••••
  Click "Login"
↓
Dashboard Shows:
  Username: alice
  SP Points: 0
  MP Score: 0
  Rank: -
↓
Click "Play Game"
↓
Mode Selection:
  Select "Player vs AI"
↓
Difficulty Selection:
  Select "Hard"
↓
Game Play:
  Win the match 3-1
↓
Game Result:
  You Won! 🎉
  +5 points earned
↓
Return to Dashboard:
  SP Points: 5 (increased!)
  Rank: #1 (if you're the only player)
↓
Click "Leaderboard":
  #1 alice - 5 points
↓
Click "Back to Dashboard"
↓
Click "Logout" to sign out
```

## For Developers

### Running the Server Locally

```bash
# Start the server
npm start

# Server runs on http://localhost:3000
# The app will connect automatically

# Or with debug output
npm start -- --debug
```

### Testing Authentication

```bash
# Run authentication tests
node test-auth.js

# Expected output:
# ✓ Register alice
# ✓ Correct reject duplicate
# ✓ Login success
# ✓ Wrong password rejected
# ✓ Add SP points
# ✓ Add MP score
# ✓ Get leaderboard
# ✓ Get user rank
```

### Testing All APIs

```bash
# Start server on different port for testing
npm start &

# Run API tests
node test-api.js

# Tests cover all endpoints:
# ✓ Register
# ✓ Duplicate rejection
# ✓ Login
# ✓ Wrong password
# ✓ Get user
# ✓ Add SP points
# ✓ Add MP score
# ✓ Update stats
# ✓ Get leaderboard
# ✓ Get user rank
```

### Understanding the Architecture

#### Client-Side (AuthService)
```javascript
// Import is automatic, available as authService

// Check if logged in
const user = authService.getUser();
if (user) {
  console.log(`Welcome ${user.username}!`);
}

// Register new user
const result = await authService.register(username, password, confirmPassword);
if (result.success) {
  console.log('Account created!');
} else {
  console.log(`Error: ${result.error}`);
}

// Login
const loginResult = await authService.login(username, password);
if (loginResult.success) {
  const userData = loginResult.user;
  console.log(`Logged in as ${userData.username}`);
}

// Get leaderboard
const leaderboard = await authService.getLeaderboard('sp');
console.log(`Top player: ${leaderboard[0].username}`);

// Get user rank
const userRank = await authService.getUserRank('sp');
console.log(`Your rank: #${userRank.rank}`);

// Logout
authService.logout();
```

#### Server-Side (UserManager)
```javascript
const UserManager = require('./server/UserManager');
const userManager = new UserManager();

// Register
const reg = userManager.register('alice', 'password123');
if (reg.success) {
  console.log(`User ${reg.user.username} created with ID ${reg.user.id}`);
}

// Login
const login = userManager.login('alice', 'password123');
if (login.success) {
  console.log(`${login.user.username} logged in`);
}

// Add points
const result = userManager.addSpPoints(userId, 5);
console.log(`${result.user.username} now has ${result.user.spPoints} points`);

// Get leaderboard
const leaderboard = userManager.getLeaderboard('sp', 100);
leaderboard.forEach(user => {
  console.log(`#${user.rank} ${user.username}: ${user.spPoints} points`);
});

// Get user rank
const userRank = userManager.getUserRank(userId, 'sp');
console.log(`${userRank.username} is ranked #${userRank.rank}`);
```

### Adding New Features

#### Add a new game mode with custom points
```javascript
// In client/js/main.js endGame():
const pointsMap = {
  'easy': 1,
  'medium': 3,
  'hard': 5,
  'nightmare': 10  // NEW!
};
```

#### Track additional user data
```javascript
// In server/User.js, add to constructor:
this.matchesWon = 0;
this.matchesLost = 0;
this.longestWinStreak = 0;

// In toJSON():
matchesWon: this.matchesWon,
matchesLost: this.matchesLost,
longestWinStreak: this.longestWinStreak
```

#### Add a new API endpoint
```javascript
// In server/server.js:
this.app.get('/api/users/:userId/stats/detailed', (req, res) => {
  const userId = req.params.userId;
  const user = this.userManager.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    ...user,
    winRate: user.matchesWon / (user.matchesWon + user.matchesLost),
    averagePointsPerGame: user.spPoints / 10  // example
  });
});
```

### Database Migration Guide

When ready to use a real database (e.g., MongoDB):

```javascript
// In server/UserManager.js, replace Map storage:

// OLD:
class UserManager {
  constructor() {
    this.users = new Map();  // id -> User
    this.usernames = new Map();  // username -> id
  }
  
  register(username, password) {
    // ... validation ...
    const id = String(this.nextUserId++);
    const user = new User(id, username, passwordHash);
    this.users.set(id, user);
    this.usernames.set(username.toLowerCase(), id);
  }
}

// NEW:
const mongoose = require('mongoose');

class UserManager {
  constructor() {
    this.User = require('../models/User');  // MongoDB model
  }
  
  async register(username, password) {
    // ... validation ...
    const user = new this.User({ username, passwordHash });
    await user.save();
    return { success: true, user: user.toJSON() };
  }
}

// Update all methods to use async/await and DB queries
// All other code remains the same!
```

## Troubleshooting

### "Network error. Make sure server is running."
- If running local server: `npm start` in project directory
- If using remote server: Check internet connection
- Verify server URL in `client/js/authService.js`: `https://rock-paper-scissors-server-smon.onrender.com`

### "Username already exists"
- Choose a different username
- Usernames are globally unique

### "Incorrect password"
- Check caps lock
- Verify password is exact match
- Try resetting by creating new account with different username

### Points not updating
- Ensure you won the match
- Check browser console for errors
- Reload and login again
- Points may take a few seconds to sync

### Can't see leaderboard
- Make sure you're logged in
- Check internet connection
- Try refreshing the leaderboard

## Tips & Tricks

1. **Fastest Way to Earn Points**
   - Easy AI games are fastest
   - 1 point per win = 60 points/hour possible
   - Multiplayer more rewarding but slower

2. **Competitive Play**
   - Multiplayer score can go negative
   - Each loss is -10 points
   - Wins harder but rewarding (+10)

3. **Session Management**
   - Your login persists across sessions
   - Close app and reopen to stay logged in
   - Click Logout to clear session

4. **Progress Tracking**
   - Dashboard updates in real-time
   - Leaderboard refreshes on demand
   - Your rank changes as you play

5. **Best Practices**
   - Use strong passwords (8+ characters)
   - Remember your username exactly
   - Check leaderboard after playing hard matches

---

**Happy playing! 🎮**

For more information, see:
- `AUTH_SYSTEM_GUIDE.md` - Complete technical guide
- `AUTHENTICATION_SYSTEM.md` - Feature documentation
- `README.md` - Project overview
