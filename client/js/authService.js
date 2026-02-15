/**
 * Authentication Service
 * Handles user login/registration and session management
 */
class AuthService {
    constructor() {
        this.currentUser = this.loadUser();
        this.apiUrl = 'https://rock-paper-scissors-server-smon.onrender.com';
    }

    /**
     * Load user from localStorage
     */
    loadUser() {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Save user to localStorage
     */
    saveUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    /**
     * Register a new user
     */
    async register(username, password, confirmPassword) {
        if (password !== confirmPassword) {
            return { success: false, error: 'Passwords do not match' };
        }

        if (username.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Do not auto-login on register; ask user to log in explicitly
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error || 'Registration failed' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Network error. Make sure server is running.' };
        }
    }

    /**
     * Login a user
     */
    async login(username, password) {
        if (!username || !password) {
            return { success: false, error: 'Username and password required' };
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.saveUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Make sure server is running.' };
        }
    }

    /**
     * Logout current user
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Update local user cache with new data
     */
    updateLocalUser(userData) {
        this.currentUser = userData;
        this.saveUser(userData);
    }

    /**
     * Update user stats
     */
    async updateStats(spPoints, mpScore) {
        if (!this.currentUser) return { success: false };

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/stats`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spPoints, mpScore })
            });

            const data = await response.json();
            if (data.success) {
                this.currentUser.spPoints = data.user.spPoints;
                this.currentUser.mpScore = data.user.mpScore;
                this.saveUser(this.currentUser);
            }
            return data;
        } catch (error) {
            console.error('Update stats error:', error);
            return { success: false };
        }
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(type = 'mp') {
        try {
            const response = await fetch(`${this.apiUrl}/api/leaderboard?type=${type}`);
            const data = await response.json();
            return data.leaderboard || [];
        } catch (error) {
            console.error('Leaderboard error:', error);
            return [];
        }
    }

    /**
     * Get user rank
     */
    async getUserRank(type = 'mp') {
        if (!this.currentUser) return null;

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/rank?type=${type}`);
            const data = await response.json();
            return data.rank;
        } catch (error) {
            console.error('Get rank error:', error);
            return null;
        }
    }
}

// Create global instance
window.authService = new AuthService();
