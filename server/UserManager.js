const User = require('./User');

class UserManager {
    constructor() {
        // In-memory storage (in production, use a real database like MongoDB or PostgreSQL)
        this.users = new Map();      // id -> User
        this.usernames = new Map();  // username -> id (for quick lookup)
        this.nextUserId = 1;
    }

    register(username, password) {
        // Validate username
        if (!username || username.trim().length === 0) {
            return { success: false, error: 'Username is required' };
        }

        if (username.length < 3 || username.length > 20) {
            return { success: false, error: 'Username must be between 3 and 20 characters' };
        }

        // Check for duplicate username
        if (this.usernames.has(username.toLowerCase())) {
            return { success: false, error: 'Username already exists' };
        }

        // Validate password
        if (!password || password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Create new user
        const id = String(this.nextUserId++);
        const passwordHash = User.hashPassword(password);
        const user = new User(id, username, passwordHash);

        // Store user
        this.users.set(id, user);
        this.usernames.set(username.toLowerCase(), id);

        return { success: true, user: user.toJSON() };
    }

    login(username, password) {
        // Find user by username (case-insensitive)
        const userId = this.usernames.get(username.toLowerCase());
        
        if (!userId) {
            return { success: false, error: 'Username not found' };
        }

        const user = this.users.get(userId);
        
        // Verify password
        if (!User.verifyPassword(password, user.passwordHash)) {
            return { success: false, error: 'Incorrect password' };
        }

        return { success: true, user: user.toJSON() };
    }

    getUser(userId) {
        const user = this.users.get(userId);
        return user ? user.toJSON() : null;
    }

    updateStats(userId, spPoints, mpScore) {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        user.updateStats(spPoints, mpScore);
        return { success: true, user: user.toJSON() };
    }

    addSpPoints(userId, points) {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        user.addSpPoints(points);
        return { success: true, user: user.toJSON() };
    }

    addMpScore(userId, points) {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        user.addMpScore(points);
        return { success: true, user: user.toJSON() };
    }

    getLeaderboard(type = 'sp', limit = 100) {
        // type: 'sp' for single-player, 'mp' for multiplayer
        const sortKey = type === 'mp' ? 'mpScore' : 'spPoints';
        
        const users = Array.from(this.users.values())
            .sort((a, b) => b[sortKey] - a[sortKey])
            .slice(0, limit)
            .map((user, index) => ({
                rank: index + 1,
                ...user.toJSON()
            }));

        return users;
    }

    getUserRank(userId, type = 'sp') {
        const sortKey = type === 'mp' ? 'mpScore' : 'spPoints';
        const user = this.users.get(userId);

        if (!user) {
            return null;
        }

        const leaderboard = this.getLeaderboard(type, this.users.size);
        const userRank = leaderboard.find(entry => entry.id === userId);

        return userRank || null;
    }

    getAllUsers() {
        return Array.from(this.users.values()).map(u => u.toJSON());
    }
}

module.exports = UserManager;
