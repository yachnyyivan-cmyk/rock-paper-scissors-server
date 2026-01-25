// Import AI Engine for browser environment
// Note: In a real implementation, you'd use proper ES6 imports or a bundler
// For now, we'll load the AI engine via script tag and access it globally

// Main application entry point
class RockPaperScissorsGame {
    constructor() {
        this.currentScreen = 'mode-selection';
        this.gameMode = null;
        this.aiDifficulty = null;
        this.socket = null;
        this.modeSelectionTimer = null;
        this.moveTimer = null;
        this.inlineQuitTimeout = null;
        this.roundResultTimer = null;
        this.gameState = null;
        this.aiEngine = null;
        this.aiThinkingTimeout = null;
        this.playerName = 'Player';
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 5;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showScreen('mode-selection');
        this.startModeSelectionTimer();
    }
    
    setupEventListeners() {
        // Mode selection buttons
        document.getElementById('pvai-btn').addEventListener('click', () => {
            this.clearModeSelectionTimer();
            this.selectMode('pvai');
        });
        
        document.getElementById('pvp-btn').addEventListener('click', () => {
            this.clearModeSelectionTimer();
            this.selectMode('pvp');
        });
        
        // AI difficulty buttons
        document.getElementById('easy-btn').addEventListener('click', () => {
            this.selectDifficulty('easy');
        });
        
        document.getElementById('medium-btn').addEventListener('click', () => {
            this.selectDifficulty('medium');
        });
        
        document.getElementById('hard-btn').addEventListener('click', () => {
            this.selectDifficulty('hard');
        });
        
        // Back buttons
        document.getElementById('back-to-mode').addEventListener('click', () => {
            this.showScreen('mode-selection');
            this.startModeSelectionTimer();
        });
        
        document.getElementById('back-to-mode-mp').addEventListener('click', () => {
            this.showScreen('mode-selection');
            this.startModeSelectionTimer();
        });
        
        // Multiplayer lobby buttons
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.showRoomInput();
        });
        
        document.getElementById('join-room-submit').addEventListener('click', () => {
            this.joinRoom();
        });
        
        // Room code input handling
        document.getElementById('room-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
        
        // Waiting room buttons
        document.getElementById('copy-room-code').addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.toggleReady();
        });
        
        document.getElementById('leave-room-btn').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        // Add visual feedback for button interactions
        this.addButtonFeedback();
    }
    
    startModeSelectionTimer() {
        // Auto-select PvAI mode after 30 seconds if no selection is made
        this.modeSelectionTimer = setTimeout(() => {
            console.log('Auto-selecting Player vs AI mode after 30 seconds');
            this.selectMode('pvai');
        }, 30000);
    }
    
    clearModeSelectionTimer() {
        if (this.modeSelectionTimer) {
            clearTimeout(this.modeSelectionTimer);
            this.modeSelectionTimer = null;
        }
    }
    
    selectMode(mode) {
        this.gameMode = mode;
        console.log(`Selected mode: ${mode}`);
        
        // Hide any error messages
        this.hideErrorMessage('mode-selection-error');
        
        if (mode === 'pvp') {
            this.initializeMultiplayer();
        } else {
            this.showScreen('ai-difficulty');
        }
    }
    
    selectDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        console.log(`Selected AI difficulty: ${difficulty}`);
        
        // Update visual feedback for selected difficulty
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('selected');
        
        // Start the AI game after a short delay for visual feedback
        setTimeout(() => {
            this.initializeSinglePlayer();
        }, 500);
    }
    
    createRoom() {
        console.log('Creating multiplayer room...');
        
        if (!this.socket || !this.socket.isSocketConnected()) {
            this.showErrorMessage('multiplayer-error', 'Not connected to server');
            return;
        }
        
        this.showScreen('loading');
        this.socket.createRoom();
    }
    
    showRoomInput() {
        const roomInput = document.getElementById('room-code-input');
        roomInput.classList.remove('hidden');
        document.getElementById('room-code').focus();
    }
    
    joinRoom() {
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        
        if (!roomCode) {
            this.showErrorMessage('multiplayer-error', 'Please enter a room code');
            return;
        }
        
        if (roomCode.length !== 6) {
            this.showErrorMessage('multiplayer-error', 'Room code must be 6 characters');
            return;
        }
        
        if (!this.socket || !this.socket.isSocketConnected()) {
            this.showErrorMessage('multiplayer-error', 'Not connected to server');
            return;
        }
        
        console.log(`Joining room: ${roomCode}`);
        this.showScreen('loading');
        this.socket.joinRoom(roomCode);
    }
    
    initializeMultiplayer() {
        this.showScreen('loading');
        console.log('Initializing multiplayer mode...');
        
        // Initialize socket connection
        this.initializeSocket();
    }
    
    /**
     * Initialize WebSocket connection to server
     */
    initializeSocket() {
        // Prompt for player name if not set
        if (!this.playerName || this.playerName === 'Player') {
            const name = prompt('Enter your player name:', 'Player');
            if (name) {
                this.playerName = name.substring(0, 20); // Limit to 20 characters
            }
        }
        
        // Create socket client instance
        if (!this.socket) {
            this.socket = new SocketClient({ playerName: this.playerName });
            
            // Setup socket event handlers
            this.setupSocketEventHandlers();
        } else if (!this.socket.isSocketConnected()) {
            this.socket.reconnect();
        }
    }
    
    /**
     * Setup all socket event handlers
     */
    setupSocketEventHandlers() {
        if (!this.socket) return;
        
        // Connection events
        this.socket.on('connected', (data) => {
            console.log('Connected to server:', data);
            this.showScreen('multiplayer-lobby');
            this.hideErrorMessage('multiplayer-error');
            this.updateConnectionStatus('✓ Connected');
        });
        
        this.socket.on('disconnected', (data) => {
            console.log('Disconnected from server:', data.reason);
            this.updateConnectionStatus('✗ Disconnected');
            this.showErrorMessage('multiplayer-error', `Disconnected: ${data.reason}`);
        });
        
        this.socket.on('connect_error', (data) => {
            console.error('Connection error:', data.error);
            this.reconnectionAttempts++;
            if (this.reconnectionAttempts > this.maxReconnectionAttempts) {
                this.showErrorMessage('multiplayer-error', 'Failed to connect to server. Please try again later.');
                this.showScreen('multiplayer-lobby');
            }
        });
        
        this.socket.on('reconnected', () => {
            console.log('Reconnected to server');
            this.reconnectionAttempts = 0;
            this.showErrorMessage('multiplayer-error', '');
        });
        
        // Room events
        this.socket.on('room_created', (data) => {
            console.log('Room created:', data.room);
            this.currentRoom = data.room;
            this.displayRoomInfo(data.room, data.roomCode);
            this.showScreen('waiting-room');
        });
        
        this.socket.on('room_joined', (data) => {
            console.log('Room joined:', data.room);
            this.currentRoom = data.room;
            this.displayRoomInfo(data.room, data.room.roomCode);
            this.showScreen('waiting-room');
        });
        
        this.socket.on('player_joined', (data) => {
            console.log('Player joined:', data.newPlayer);
            this.currentRoom = data.room;
            this.updateWaitingRoomDisplay(data.room);
            this.showNotification(`${data.newPlayer.name} joined the room`);
        });
        
        this.socket.on('player_left', (data) => {
            console.log('Player left:', data);
            this.currentRoom = data.room;
            if (data.room.players.length === 0) {
                this.showErrorMessage('multiplayer-error', 'You are alone in the room');
            } else {
                this.updateWaitingRoomDisplay(data.room);
                this.showNotification('Opponent left the room');
            }
        });
        
        this.socket.on('player_disconnected', (data) => {
            console.log('Player disconnected:', data);
            this.currentRoom = data.room;
            this.showNotification('Opponent disconnected');
        });
        
        this.socket.on('room_error', (data) => {
            console.error('Room error:', data.error);
            this.showErrorMessage('multiplayer-error', data.error);
        });
        
        this.socket.on('player_ready_update', (data) => {
            console.log('Player ready update:', data);
            this.currentRoom = data.room;
            this.updateReadyStatus(data.room);
            
            // Check if both players are ready to start game
            if (this.canStartGame(data.room)) {
                this.startMultiplayerGame();
            }
        });
        
        // Game events
        this.socket.on('game_state', (data) => {
            console.log('Game state received:', data);
            this.currentRoom = data.room;
        });
        
        this.socket.on('move_submitted', (data) => {
            console.log('Move submitted successfully');
            this.showNotification('Your move has been submitted');
        });
        
        this.socket.on('all_moves_submitted', (data) => {
            console.log('All moves submitted');
            this.revealOpponentMove();
        });
        
        this.socket.on('round_result', (data) => {
            console.log('Round result:', data);
            this.currentRoom = data.room;
            this.handleMultiplayerRoundResult(data);
        });
        
        this.socket.on('game_error', (data) => {
            console.error('Game error:', data.error);
            this.showErrorMessage('game-error', data.error);
        });
        
        // Connection status
        this.socket.on('connection_status', (data) => {
            console.log('Connection status:', data);
            if (!data.connected) {
                this.showErrorMessage('multiplayer-error', 'Lost connection to server');
            }
        });
    }
    
    initializeSinglePlayer() {
        console.log(`Initializing single player mode with ${this.aiDifficulty} difficulty...`);
        
        // Initialize AI Engine
        try {
            // In a real implementation, you'd import AIEngine properly
            // For now, we'll simulate the AI engine functionality
            this.aiEngine = this.createAIEngine(this.aiDifficulty);
        } catch (error) {
            console.error('Failed to initialize AI Engine:', error);
            this.showErrorMessage('ai-error', 'Failed to initialize AI. Please try again.');
            return;
        }
        
        // Initialize game state
        this.gameState = {
            mode: 'pvai',
            difficulty: this.aiDifficulty,
            playerScore: 0,
            aiScore: 0,
            currentRound: 1,
            maxScore: 5,
            playerMove: null,
            aiMove: null,
            gameStatus: 'playing',
            playerMoveHistory: []
        };
        
        this.setupGameScreen();
        this.showScreen('game-screen');
    }
    
    setupGameScreen() {
        // Update game header
        document.getElementById('game-mode-title').textContent = 'Player vs AI';
        document.getElementById('difficulty-display').textContent = this.aiDifficulty.charAt(0).toUpperCase() + this.aiDifficulty.slice(1);
        document.getElementById('opponent-label').textContent = 'AI';
        
        // Reset scores and round
        this.updateScoreDisplay();
        this.updateRoundDisplay();
        
        // Reset move displays
        document.getElementById('player-move-display').textContent = '❓';
        document.getElementById('opponent-move-display').textContent = '❓';
        
        // Hide result display and show move selection
        document.getElementById('result-display').classList.add('hidden');
        document.getElementById('move-selection').classList.remove('hidden');
        document.getElementById('play-again-btn').classList.add('hidden');
        
        // Enable move buttons for first round
        this.enableMoveButtons();
        
        // Setup move selection event listeners
        this.setupMoveSelection();
        
        // Setup game control listeners
        this.setupGameControls();
        
        // Start move timer
        this.startMoveTimer();
    }
    
    setupMoveSelection() {
        const moveButtons = document.querySelectorAll('.move-btn');
        
        moveButtons.forEach(button => {
            // Remove existing listeners
            button.replaceWith(button.cloneNode(true));
        });
        
        // Add new listeners
        document.querySelectorAll('.move-btn').forEach(button => {
            button.addEventListener('click', () => {
                const move = button.dataset.move;
                this.makePlayerMove(move);
            });
        });
    }
    
    setupGameControls() {
        // Remove existing listeners
        const playAgainBtn = document.getElementById('play-again-btn');
        const quitBtn = document.getElementById('quit-game-btn');
        
        playAgainBtn.replaceWith(playAgainBtn.cloneNode(true));
        quitBtn.replaceWith(quitBtn.cloneNode(true));
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            if (this.gameState.gameStatus === 'finished') {
                this.startNewGame();
            } else {
                this.startNewRound();
            }
        });
        
        document.getElementById('quit-game-btn').addEventListener('click', () => {
            this.showInlineQuitConfirm();
        });
    }
    
    startNewGame() {
        // Reset AI engine if it exists
        if (this.aiEngine) {
            this.aiEngine.reset();
        }
        
        // Reset game state
        this.gameState = {
            mode: 'pvai',
            difficulty: this.aiDifficulty,
            playerScore: 0,
            aiScore: 0,
            currentRound: 1,
            maxScore: 5,
            playerMove: null,
            aiMove: null,
            gameStatus: 'playing',
            playerMoveHistory: []
        };
        
        // Reset play again button text
        document.getElementById('play-again-btn').textContent = 'Play Again';
        
        this.setupGameScreen();
    }
    
    makePlayerMove(move) {
        if (this.gameState.playerMove) return; // Move already made
        
        this.gameState.playerMove = move;
        this.gameState.playerMoveHistory.push(move);
        this.freezeMoveTimer();
        
        // Update UI
        this.updatePlayerMoveDisplay(move);
        this.disableMoveButtons();
        
        // Handle single-player vs multiplayer mode
        if (this.gameMode === 'pvp' && this.socket) {
            // Multiplayer mode: submit move to server
            if (!this.socket.isSocketConnected()) {
                console.error('Socket not connected! Status:', this.socket.isConnected);
                this.showNotification('❌ Connection lost. Reconnecting...');
                this.socket.reconnect();
                return;
            }
            console.log('Submitting move:', move);
            this.socket.submitMove(move);
            this.showNotification('Waiting for opponent...');
        } else {
            // Single-player mode: use AI engine
            // Record move in AI engine for learning
            if (this.aiEngine) {
                this.aiEngine.recordPlayerMove(move);
            }
            
            // Show AI thinking indicator
            this.showAIThinking();
            
            // Generate AI move with realistic thinking time
            const thinkingTime = this.aiEngine ? this.aiEngine.getThinkingTime() : this.getDefaultThinkingTime();
            
            this.aiThinkingTimeout = setTimeout(() => {
                this.generateAIMove();
            }, thinkingTime);
        }
    }
    
    generateAIMove() {
        let aiMove;
        
        // Use AI Engine if available, otherwise fallback to simple logic
        if (this.aiEngine) {
            try {
                aiMove = this.aiEngine.makeMove();
            } catch (error) {
                console.error('AI Engine error:', error);
                aiMove = this.getRandomMove();
            }
        } else {
            // Fallback AI implementation based on difficulty
            switch (this.aiDifficulty) {
                case 'easy':
                    aiMove = this.getRandomMove();
                    break;
                case 'medium':
                    aiMove = this.getMediumAIMove();
                    break;
                case 'hard':
                    aiMove = this.getHardAIMove();
                    break;
                default:
                    aiMove = this.getRandomMove();
            }
        }
        
        this.gameState.aiMove = aiMove;
        
        // Hide AI thinking and show move
        this.hideAIThinking();
        this.updateAIMoveDisplay(aiMove);
        
        // Calculate and show result
        setTimeout(() => {
            this.calculateRoundResult();
        }, 500);
    }
    
    getRandomMove() {
        const moves = ['rock', 'paper', 'scissors'];
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    getMediumAIMove() {
        // For now, just return random (will be enhanced in AI tasks)
        return this.getRandomMove();
    }
    
    getHardAIMove() {
        // For now, just return random (will be enhanced in AI tasks)
        return this.getRandomMove();
    }
    
    calculateRoundResult() {
        const playerMove = this.gameState.playerMove;
        const aiMove = this.gameState.aiMove;
        
        let result;
        if (playerMove === aiMove) {
            result = 'tie';
        } else if (
            (playerMove === 'rock' && aiMove === 'scissors') ||
            (playerMove === 'paper' && aiMove === 'rock') ||
            (playerMove === 'scissors' && aiMove === 'paper')
        ) {
            result = 'win';
            this.gameState.playerScore++;
        } else {
            result = 'lose';
            this.gameState.aiScore++;
        }
        
        // Update AI strategy based on result
        if (this.aiEngine) {
            try {
                this.aiEngine.updateStrategy(aiMove, playerMove, result === 'win' ? 'lose' : (result === 'lose' ? 'win' : 'tie'));
            } catch (error) {
                console.error('Error updating AI strategy:', error);
            }
        }
        
        this.showRoundResult(result, playerMove, aiMove);
        this.updateScoreDisplay();
        
        // Check for game end
        if (this.gameState.playerScore >= this.gameState.maxScore || 
            this.gameState.aiScore >= this.gameState.maxScore) {
            this.endGame();
        } else {
            this.gameState.currentRound++;
            this.updateRoundDisplay();
            document.getElementById('play-again-btn').classList.remove('hidden');
        }
    }
    
    showRoundResult(result, playerMove, aiMove) {
        const resultDisplay = document.getElementById('result-display');
        const resultText = document.getElementById('result-text');
        const resultDetails = document.getElementById('result-details');
        
        // Remove previous result classes
        resultDisplay.classList.remove('win', 'lose', 'tie');
        
        switch (result) {
            case 'win':
                resultDisplay.classList.add('win');
                resultText.textContent = 'You Win!';
                resultDetails.textContent = `${this.getMoveEmoji(playerMove)} beats ${this.getMoveEmoji(aiMove)}`;
                break;
            case 'lose':
                resultDisplay.classList.add('lose');
                resultText.textContent = 'You Lose!';
                resultDetails.textContent = `${this.getMoveEmoji(aiMove)} beats ${this.getMoveEmoji(playerMove)}`;
                break;
            case 'tie':
                resultDisplay.classList.add('tie');
                resultText.textContent = "It's a Tie!";
                resultDetails.textContent = `Both chose ${this.getMoveEmoji(playerMove)}`;
                break;
        }
        
        resultDisplay.classList.remove('hidden');
        document.getElementById('move-selection').classList.add('hidden');
        
        // Start 3-second auto-advance timer
        this.startRoundResultTimer();
    }
    
    startRoundResultTimer() {
        // Clear any existing timer
        this.clearRoundResultTimer();
        
        const resultDetails = document.getElementById('result-details');
        let countdown = 3;
        
        // Create countdown display
        const countdownElement = document.createElement('div');
        countdownElement.className = 'auto-advance-timer';
        countdownElement.textContent = `Next round in ${countdown}...`;
        resultDetails.appendChild(countdownElement);
        
        // Update countdown every second
        this.roundResultTimer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownElement.textContent = `Next round in ${countdown}...`;
            } else {
                this.clearRoundResultTimer();
                // Check if game is not over before starting new round
                if (this.gameState.playerScore < this.gameState.maxScore && 
                    this.gameState.aiScore < this.gameState.maxScore) {
                    this.startNewRound();
                }
            }
        }, 1000);
    }
    
    clearRoundResultTimer() {
        if (this.roundResultTimer) {
            clearInterval(this.roundResultTimer);
            this.roundResultTimer = null;
        }
        
        // Remove countdown element if it exists
        const countdownElement = document.querySelector('.auto-advance-timer');
        if (countdownElement) {
            countdownElement.remove();
        }
    }
    
    getMoveEmoji(move) {
        const emojis = {
            rock: '🪨',
            paper: '📄',
            scissors: '✂️'
        };
        return emojis[move] || '❓';
    }
    
    updatePlayerMoveDisplay(move) {
        document.getElementById('player-move-display').textContent = this.getMoveEmoji(move);
        
        // Add visual feedback to selected button
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-move="${move}"]`).classList.add('selected');
    }
    
    updateAIMoveDisplay(move) {
        document.getElementById('opponent-move-display').textContent = this.getMoveEmoji(move);
    }
    
    updateScoreDisplay() {
        const opponentScore = this.gameMode === 'pvp' 
            ? this.gameState.opponentScore 
            : this.gameState.aiScore;
        
        document.getElementById('player-score').textContent = this.gameState.playerScore;
        document.getElementById('opponent-score').textContent = opponentScore;
    }
    
    updateRoundDisplay() {
        document.getElementById('current-round').textContent = this.gameState.currentRound;
    }
    
    disableMoveButtons() {
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.classList.add('disabled');
        });
    }
    
    enableMoveButtons() {
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.classList.remove('disabled', 'selected');
        });
    }
    
    startMoveTimer() {
        this.clearMoveTimer();
        
        const timerBar = document.getElementById('timer-bar');
        const timerSeconds = document.getElementById('timer-seconds');
        
        let timeLeft = 15;
        timerSeconds.textContent = timeLeft;
        
        // Force browser to paint initial state before starting animation
        timerBar.classList.remove('running');
        
        // Force a reflow to ensure the class removal is applied
        void timerBar.offsetWidth;
        
        // Use setTimeout to give browser time to render the reset state
        setTimeout(() => {
            timerBar.classList.add('running');
        }, 50);
        
        this.moveTimer = setInterval(() => {
            timeLeft--;
            timerSeconds.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.clearMoveTimer();
                if (!this.gameState.playerMove) {
                    this.makePlayerMove('rock'); // Auto-select rock
                }
            }
        }, 1000);
    }
    
    freezeMoveTimer() {
        if (this.moveTimer) {
            clearInterval(this.moveTimer);
            this.moveTimer = null;
        }
        
        const timerBar = document.getElementById('timer-bar');
        const timerSeconds = document.getElementById('timer-seconds');
        
        // Get current width and freeze it
        const computedStyle = window.getComputedStyle(timerBar, '::after');
        const currentWidth = computedStyle.width;
        
        // Remove running class and set explicit width to freeze
        timerBar.classList.remove('running');
        timerBar.classList.add('frozen');
        timerBar.style.setProperty('--frozen-width', currentWidth);
    }
    
    clearMoveTimer() {
        if (this.moveTimer) {
            clearInterval(this.moveTimer);
            this.moveTimer = null;
        }
        
        const timerBar = document.getElementById('timer-bar');
        timerBar.classList.remove('running', 'frozen');
        timerBar.style.removeProperty('--frozen-width');
    }
    
    startNewRound() {
        // Clear any ongoing AI thinking
        this.clearAIThinking();
        
        // Clear round result timer
        this.clearRoundResultTimer();
        
        // Reset round state
        this.gameState.playerMove = null;
        this.gameState.aiMove = null;
        
        // Reset UI
        document.getElementById('player-move-display').textContent = '❓';
        document.getElementById('opponent-move-display').textContent = '❓';
        document.getElementById('result-display').classList.add('hidden');
        document.getElementById('move-selection').classList.remove('hidden');
        document.getElementById('play-again-btn').classList.add('hidden');
        
        this.enableMoveButtons();
        this.startMoveTimer();
    }
    
    endGame() {
        const isPlayerWinner = this.gameState.playerScore >= this.gameState.maxScore;
        const resultDisplay = document.getElementById('result-display');
        const resultText = document.getElementById('result-text');
        const resultDetails = document.getElementById('result-details');
        
        // Remove previous result classes
        resultDisplay.classList.remove('win', 'lose', 'tie');
        
        // Get AI statistics for display
        const aiStats = this.aiEngine ? this.aiEngine.getStrategyStats() : null;
        
        if (isPlayerWinner) {
            resultDisplay.classList.add('win');
            resultText.textContent = '🎉 Game Won!';
            resultDetails.textContent = `You defeated the ${this.aiDifficulty} AI ${this.gameState.playerScore}-${this.gameState.aiScore}`;
        } else {
            resultDisplay.classList.add('lose');
            resultText.textContent = '😔 Game Over';
            resultDetails.textContent = `${this.aiDifficulty.charAt(0).toUpperCase() + this.aiDifficulty.slice(1)} AI won ${this.gameState.aiScore}-${this.gameState.playerScore}`;
        }
        
        resultDisplay.classList.remove('hidden');
        document.getElementById('move-selection').classList.add('hidden');
        
        // Show game control buttons
        const playAgainBtn = document.getElementById('play-again-btn');
        playAgainBtn.textContent = 'Play New Game';
        playAgainBtn.classList.remove('hidden');
        
        // Add return to menu button
        this.showGameEndControls();
        
        this.gameState.gameStatus = 'finished';
        
        // Log game completion for analytics
        this.logGameCompletion(isPlayerWinner);
    }
    
    /**
     * Shows enhanced game end controls
     */
    showGameEndControls() {
        const gameControls = document.getElementById('game-controls') || document.querySelector('.game-controls');
        
        // Add return to menu button if it doesn't exist
        if (!document.getElementById('return-to-menu-btn')) {
            const returnBtn = document.createElement('button');
            returnBtn.id = 'return-to-menu-btn';
            returnBtn.className = 'control-btn';
            returnBtn.textContent = 'Return to Menu';
            returnBtn.addEventListener('click', () => {
                this.returnToMenu();
            });
            gameControls.appendChild(returnBtn);
        }
        
        document.getElementById('return-to-menu-btn').classList.remove('hidden');
    }
    
    /**
     * Returns to the main menu
     */
    returnToMenu() {
        if (confirm('Return to main menu? Current game progress will be lost.')) {
            this.clearMoveTimer();
            this.clearAIThinking();
            this.gameState = null;
            this.aiEngine = null;
            this.showScreen('mode-selection');
            this.startModeSelectionTimer();
        }
    }
    
    /**
     * Logs game completion for analytics
     */
    logGameCompletion(playerWon) {
        const gameData = {
            mode: 'pvai',
            difficulty: this.aiDifficulty,
            playerWon: playerWon,
            finalScore: `${this.gameState.playerScore}-${this.gameState.aiScore}`,
            totalRounds: this.gameState.currentRound - 1,
            playerMoves: this.gameState.playerMoveHistory.length,
            aiStats: this.aiEngine ? this.aiEngine.getStrategyStats() : null,
            timestamp: new Date().toISOString()
        };
        
        console.log('Game Completed:', gameData);
        
        // In a real implementation, you might send this to analytics
        // this.sendAnalytics('game_completed', gameData);
    }
    
    quitGame() {
        // Immediate quit without blocking modal
        this.clearMoveTimer();
        this.clearAIThinking();
        this.hideInlineQuitConfirm();
        this.showScreen('mode-selection');
        this.startModeSelectionTimer();
    }

    /**
     * Shows an inline confirm button next to Quit Game without freezing timer
     */
    showInlineQuitConfirm() {
        const quitBtn = document.getElementById('quit-game-btn');
        if (!quitBtn) return;

        // If already visible, toggle off
        const existing = document.getElementById('confirm-quit-btn');
        if (existing) {
            this.hideInlineQuitConfirm();
            return;
        }

        // Create inline confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-quit-btn';
        confirmBtn.className = 'control-btn inline-confirm';
        confirmBtn.textContent = 'Confirm quit';
        // Ensure red styling regardless of CSS cascade
        confirmBtn.style.background = '#e53935';
        confirmBtn.style.color = '#ffffff';
        confirmBtn.style.border = 'none';
        confirmBtn.style.fontWeight = '600';
        confirmBtn.addEventListener('click', () => {
            this.quitGame();
        });

        // Insert after the Quit Game button
        quitBtn.parentNode.insertBefore(confirmBtn, quitBtn.nextSibling);

        // Auto-hide after 3 seconds to avoid lingering
        this.clearInlineQuitTimeout();
        this.inlineQuitTimeout = setTimeout(() => {
            this.hideInlineQuitConfirm();
        }, 3000);
    }

    hideInlineQuitConfirm() {
        this.clearInlineQuitTimeout();
        const existing = document.getElementById('confirm-quit-btn');
        if (existing) existing.remove();
    }

    clearInlineQuitTimeout() {
        if (this.inlineQuitTimeout) {
            clearTimeout(this.inlineQuitTimeout);
            this.inlineQuitTimeout = null;
        }
    }
    
    // Multiplayer Helper Methods
    
    /**
     * Display room information in waiting room
     */
    displayRoomInfo(room, roomCode) {
        const roomCodeDisplay = document.getElementById('room-code-display');
        if (roomCodeDisplay) {
            roomCodeDisplay.textContent = roomCode;
        }
        
        const playersInfo = document.getElementById('players-info');
        if (playersInfo) {
            playersInfo.textContent = `${room.players.length}/2 players`;
        }
        
        this.updateWaitingRoomDisplay(room);
    }
    
    /**
     * Update waiting room player list display
     */
    updateWaitingRoomDisplay(room) {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;
        
        playersList.innerHTML = '';
        
        room.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="player-status">${player.isReady ? '✓ Ready' : 'Waiting'}</div>
            `;
            playersList.appendChild(playerDiv);
        });
    }
    
    /**
     * Update ready status display
     */
    updateReadyStatus(room) {
        const readyBtn = document.getElementById('ready-btn');
        if (!readyBtn) return;
        
        const currentPlayer = room.players.find(p => p.id === this.socket.playerId);
        if (currentPlayer && currentPlayer.isReady) {
            readyBtn.textContent = 'Not Ready';
            readyBtn.classList.add('ready');
        } else {
            readyBtn.textContent = 'Ready';
            readyBtn.classList.remove('ready');
        }
        
        this.updateWaitingRoomDisplay(room);
    }
    
    /**
     * Check if game can start (all players ready and room full)
     */
    canStartGame(room) {
        if (room.players.length !== 2) return false;
        return room.players.every(p => p.isReady);
    }
    
    /**
     * Start multiplayer game
     */
    startMultiplayerGame() {
        console.log('Starting multiplayer game...');
        
        this.gameState = {
            mode: 'pvp',
            playerScore: 0,
            opponentScore: 0,
            currentRound: 1,
            maxScore: 5,
            playerMove: null,
            opponentMove: null,
            gameStatus: 'playing'
        };
        
        this.setupMultiplayerGameScreen();
        this.showScreen('game-screen');
    }
    
    /**
     * Setup multiplayer game screen
     */
    setupMultiplayerGameScreen() {
        document.getElementById('game-mode-title').textContent = 'Player vs Player';
        document.getElementById('difficulty-display').textContent = 'Online';
        document.getElementById('opponent-label').textContent = 'Opponent';
        
        this.updateScoreDisplay();
        this.updateRoundDisplay();
        
        document.getElementById('player-move-display').textContent = '❓';
        document.getElementById('opponent-move-display').textContent = '❓';
        
        document.getElementById('result-display').classList.add('hidden');
        document.getElementById('move-selection').classList.remove('hidden');
        
        this.setupMoveSelection();
        this.setupGameControls();
        this.startMoveTimer();
    }
    
    /**
     * Handle multiplayer round result
     */
    handleMultiplayerRoundResult(data) {
        const winner = data.winner;
        
        // Display opponent's move
        if (data.moves) {
            const playerIds = Object.keys(data.moves);
            const opponentId = playerIds.find(id => id !== this.socket.playerId);
            if (opponentId) {
                this.gameState.opponentMove = data.moves[opponentId];
                this.updateAIMoveDisplay(data.moves[opponentId]);
            }
        }
        
        // Calculate and display result
        if (winner === 'tie') {
            this.displayRoundResult('Tie!', 'Both players chose the same move');
        } else if (winner === this.socket.playerId) {
            this.gameState.playerScore++;
            this.displayRoundResult('You Win! 🎉', 'You won this round');
        } else {
            this.gameState.opponentScore++;
            this.displayRoundResult('You Lose', 'Opponent won this round');
        }
        
        this.updateScoreDisplay();
        
        // Check if game is over
        if (this.gameState.playerScore >= this.gameState.maxScore || 
            this.gameState.opponentScore >= this.gameState.maxScore) {
            this.endMultiplayerGame();
        } else {
            this.gameState.currentRound++;
            this.updateRoundDisplay();
            
            // Reset moves for next round
            this.gameState.playerMove = null;
            this.gameState.opponentMove = null;
            
            // Show play again button for next round
            document.getElementById('play-again-btn').classList.remove('hidden');
            document.getElementById('play-again-btn').textContent = 'Next Round';
        }
    }
    
    /**
     * End multiplayer game
     */
    endMultiplayerGame() {
        const playerWon = this.gameState.playerScore > this.gameState.opponentScore;
        const resultText = playerWon ? 'You Won the Match! 🏆' : 'Match Over - Opponent Won';
        
        this.displayGameEnd(resultText, playerWon);
        
        document.getElementById('play-again-btn').textContent = 'Return to Menu';
        document.getElementById('play-again-btn').classList.remove('hidden');
    }
    
    /**
     * Reveal opponent move (called when all moves are submitted)
     */
    revealOpponentMove() {
        // This will be called when server broadcasts that all moves are submitted
        // In a real implementation, we'd need to get the opponent move from the server
        // For now, this is a placeholder that waits for round result
        console.log('All players have submitted moves, waiting for result calculation...');
    }
    
    /**
     * Show notification message
     */
    showNotification(message) {
        console.log('Notification:', message);
        // TODO: Implement visual notification display
    }
    
    /**
     * Update connection status display
     */
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = status;
            if (status.includes('✓')) {
                statusEl.style.color = '#27ae60';
            } else {
                statusEl.style.color = '#e74c3c';
            }
        }
    }
    
    /**
     * Copy room code to clipboard
     */
    copyRoomCode() {
        const roomCodeDisplay = document.getElementById('room-code-display');
        const roomCode = roomCodeDisplay.textContent;
        
        navigator.clipboard.writeText(roomCode).then(() => {
            const copyBtn = document.getElementById('copy-room-code');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy room code:', err);
            this.showErrorMessage('multiplayer-error', 'Failed to copy room code');
        });
    }
    
    /**
     * Toggle player ready status
     */
    toggleReady() {
        if (!this.socket || !this.socket.isSocketConnected()) {
            this.showErrorMessage('multiplayer-error', 'Not connected to server');
            return;
        }
        
        // Check current ready status from button state
        const readyBtn = document.getElementById('ready-btn');
        const isCurrentlyReady = readyBtn.classList.contains('ready');
        
        // Toggle the status
        this.socket.setReady(!isCurrentlyReady);
    }
    
    /**
     * Leave current room
     */
    leaveRoom() {
        if (confirm('Leave room? You will return to the lobby.')) {
            if (this.socket) {
                this.socket.leaveRoom();
            }
            this.currentRoom = null;
            this.showScreen('multiplayer-lobby');
        }
    }
    
    // AI Engine Integration Methods
    
    /**
     * Creates an AI engine instance based on difficulty
     * @param {string} difficulty - AI difficulty level
     * @returns {Object} AI engine instance
     */
    createAIEngine(difficulty) {
        // Use the real AIEngine class now that it's loaded
        if (typeof window.AIEngine !== 'undefined') {
            return new window.AIEngine(difficulty, 'human');
        }
        
        // Fallback to mock implementation if AIEngine is not available
        return {
            difficulty: difficulty,
            moveHistory: [],
            patterns: { sequences: new Map(), frequencies: new Map(), lastMoves: [] },
            
            recordPlayerMove: function(move) {
                this.moveHistory.push(move);
                const freq = this.patterns.frequencies.get(move) || 0;
                this.patterns.frequencies.set(move, freq + 1);
                
                this.patterns.lastMoves.push(move);
                if (this.patterns.lastMoves.length > 5) {
                    this.patterns.lastMoves.shift();
                }
            },
            
            makeMove: function() {
                const moves = ['rock', 'paper', 'scissors'];
                return moves[Math.floor(Math.random() * moves.length)];
            },
            
            getThinkingTime: function() {
                switch (this.difficulty) {
                    case 'easy': return 500 + Math.random() * 1000;
                    case 'medium': return 1000 + Math.random() * 1500;
                    case 'hard': return 1500 + Math.random() * 2000;
                    default: return 1000;
                }
            },
            
            updateStrategy: function(aiMove, playerMove, result) {
                console.log(`AI Strategy Update: AI played ${aiMove}, Player played ${playerMove}, Result: ${result}`);
            },
            
            reset: function() {
                this.moveHistory = [];
                this.patterns = { sequences: new Map(), frequencies: new Map(), lastMoves: [] };
            },
            
            getStrategyStats: function() {
                return {
                    name: this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1) + ' AI',
                    description: `${this.difficulty} difficulty AI opponent`,
                    movesAnalyzed: this.moveHistory.length,
                    expectedWinRate: this.difficulty === 'easy' ? 0.33 : (this.difficulty === 'medium' ? 0.55 : 0.75)
                };
            }
        };
    }
    
    /**
     * Shows AI thinking indicator with enhanced visual feedback
     */
    showAIThinking() {
        const thinkingElement = document.getElementById('ai-thinking');
        const opponentMoveDisplay = document.getElementById('opponent-move-display');
        
        thinkingElement.classList.remove('hidden');
        opponentMoveDisplay.textContent = '🤔';
        
        // Add pulsing animation class if it exists
        thinkingElement.classList.add('thinking-active');
    }
    
    /**
     * Hides AI thinking indicator
     */
    hideAIThinking() {
        const thinkingElement = document.getElementById('ai-thinking');
        thinkingElement.classList.add('hidden');
        thinkingElement.classList.remove('thinking-active');
    }
    
    /**
     * Clears AI thinking timeout
     */
    clearAIThinking() {
        if (this.aiThinkingTimeout) {
            clearTimeout(this.aiThinkingTimeout);
            this.aiThinkingTimeout = null;
        }
        this.hideAIThinking();
    }
    
    /**
     * Gets default thinking time when AI engine is not available
     * @returns {number} Thinking time in milliseconds
     */
    getDefaultThinkingTime() {
        switch (this.aiDifficulty) {
            case 'easy': return 500 + Math.random() * 1000; // 0.5-1.5s
            case 'medium': return 1000 + Math.random() * 1500; // 1-2.5s
            case 'hard': return 1500 + Math.random() * 2000; // 1.5-3.5s
            default: return 1000;
        }
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }
    
    showErrorMessage(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
    
    hideErrorMessage(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }
    
    addButtonFeedback() {
        // Add click feedback to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new RockPaperScissorsGame();
});