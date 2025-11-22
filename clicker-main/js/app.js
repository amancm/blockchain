/**
 * Main Application Class - Orchestrates all modules
 * Connects Web3Service, GameEngine, and UIController
 * @class App
 */

import { Web3Service } from './Web3Service.js';
import { GameEngine } from './GameEngine.js';
import { UIController } from './UIController.js';
import { CONFIG, ALERT_TYPES, GAME_STATES } from './config.js';

export class App {
    constructor() {
        // Initialize services
        this.web3Service = new Web3Service();
        this.gameEngine = new GameEngine();
        this.uiController = new UIController();
        
        // Application state
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            this._setupGameEngineCallbacks();
            this._setupUIEventHandlers();
            this._checkDemoMode();
            
            this.isInitialized = true;
            console.log('✅ Clicker Challenge initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.uiController.showAlert(
                'Failed to initialize application. Please refresh the page.',
                ALERT_TYPES.ERROR
            );
        }
    }

    /**
     * Setup game engine event callbacks
     * @private
     */
    _setupGameEngineCallbacks() {
        // State change handler
        this.gameEngine.setOnStateChange((state) => {
            this._handleGameStateChange(state);
        });

        // Timer update handler
        this.gameEngine.setOnTimerUpdate((timerData) => {
            this.uiController.updateTimer(timerData.timeLeft, timerData.status);
        });

        // Click count update handler
        this.gameEngine.setOnClickCountUpdate((count) => {
            this.uiController.updateClickCount(count);
        });

        // Countdown tick handler
        this.gameEngine.setOnCountdownTick((count) => {
            this.uiController.updateCountdown(count);
        });

        // Game end handler
        this.gameEngine.setOnGameEnd((gameData) => {
            this._handleGameEnd(gameData);
        });
    }

    /**
     * Setup UI event handlers
     * @private
     */
    _setupUIEventHandlers() {
        // Connect wallet button
        this.uiController.onConnectClick(() => {
            this._handleConnectWallet();
        });

        // Start game button
        this.uiController.onStartClick(() => {
            this._handleStartGame();
        });

        // Click button
        this.uiController.onClickButtonClick(() => {
            this._handleClick();
        });

        // Play again button
        this.uiController.onPlayAgainClick(() => {
            this._handlePlayAgain();
        });
    }

    /**
     * Check if running in demo mode
     * @private
     */
    _checkDemoMode() {
        if (CONFIG.CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
            this.uiController.showAlert(
                'Demo mode - Deploy the contract to enable blockchain features',
                ALERT_TYPES.WARNING
            );
        }
    }

    // ========== Event Handlers ==========

    /**
     * Handle wallet connection
     * @private
     */
    async _handleConnectWallet() {
        if (!this.web3Service.isMetaMaskInstalled()) {
            this.uiController.showAlert(
                'Please install MetaMask to play!',
                ALERT_TYPES.ERROR
            );
            return;
        }

        const result = await this.web3Service.connect();

        if (result.success) {
            this.uiController.updateWalletUI(true, result.address);
            this.uiController.updateGameStatus('Ready to play!');
            this.uiController.showAlert(
                'Wallet connected successfully!',
                ALERT_TYPES.SUCCESS
            );
            
            // Load player stats
            await this._loadPlayerStats();
            
        } else {
            this.uiController.showAlert(
                result.error || 'Failed to connect wallet',
                ALERT_TYPES.ERROR
            );
        }
    }

    /**
     * Handle start game button click
     * @private
     */
    async _handleStartGame() {
        if (!this.web3Service.isConnected()) {
            this.uiController.showAlert(
                'Please connect your wallet first!',
                ALERT_TYPES.ERROR
            );
            return;
        }

        this.uiController.setStartButtonEnabled(false);
        this.uiController.showCountdown(CONFIG.GAME.COUNTDOWN_START);
        this.gameEngine.startCountdown();
    }

    /**
     * Handle click button
     * @private
     */
    _handleClick() {
        if (this.gameEngine.isPlaying()) {
            this.gameEngine.registerClick();
        }
    }

    /**
     * Handle play again button
     * @private
     */
    _handlePlayAgain() {
        this.uiController.hideResultsModal();
        this.gameEngine.reset();
        this.uiController.resetGameUI();
    }

    /**
     * Handle game state changes
     * @private
     * @param {string} state - New game state
     */
    _handleGameStateChange(state) {
        switch (state) {
            case GAME_STATES.IDLE:
                this.uiController.setClickButtonEnabled(false);
                this.uiController.setStartButtonEnabled(true);
                this.uiController.updateGameStatus('Ready to play!');
                break;

            case GAME_STATES.COUNTDOWN:
                this.uiController.updateGameStatus('Get ready...');
                break;

            case GAME_STATES.PLAYING:
                this.uiController.hideCountdown();
                this.uiController.setClickButtonEnabled(true);
                this.uiController.updateGameStatus('Click as fast as you can!');
                break;

            case GAME_STATES.FINISHED:
                this.uiController.setClickButtonEnabled(false);
                this.uiController.updateGameStatus('Game over!');
                break;
        }
    }

    /**
     * Handle game end
     * @private
     * @param {Object} gameData - Game statistics
     */
    async _handleGameEnd(gameData) {
        const score = gameData.score;
        
        // Show results modal
        this.uiController.showResultsModal(score, 'Processing...');

        // Submit score and update stats
        await this._submitScore(score);
    }

    /**
     * Submit score to blockchain or save locally
     * @private
     * @param {number} score - Game score
     */
    async _submitScore(score) {
        try {
            if (this.web3Service.isDemoMode || !this.web3Service.contract) {
                // Demo mode - save locally
                this.uiController.saveDemoStats(score);
                this.uiController.updateStorageStatus('✅ Score saved locally (demo mode)');
                this.uiController.setStartButtonEnabled(true);
                return;
            }

            // Check if score is valid for blockchain submission
            if (score === 0) {
                this.uiController.updateStorageStatus('No score to submit (0 clicks)');
                this.uiController.showAlert(
                    'Play again and click to submit a score!',
                    ALERT_TYPES.INFO
                );
                this.uiController.setStartButtonEnabled(true);
                return;
            }

            // Submit to blockchain
            this.uiController.updateGameStatus('Storing on blockchain...');
            this.uiController.updateStorageStatus('Storing on blockchain...');

            const result = await this.web3Service.submitScore(score);

            if (result.success) {
                this.uiController.updateStorageStatus('✅ Score stored on-chain!');
                this.uiController.showAlert(
                    'Score successfully stored on blockchain!',
                    ALERT_TYPES.SUCCESS
                );
                
                // Reload stats
                await this._loadPlayerStats();
                
            } else {
                this.uiController.updateStorageStatus('❌ Failed to store score');
                this.uiController.showAlert(
                    `Failed to submit score: ${result.error}`,
                    ALERT_TYPES.ERROR
                );
            }

            this.uiController.setStartButtonEnabled(true);
            this.uiController.updateGameStatus('Ready to play!');

        } catch (error) {
            console.error('Submit score error:', error);
            this.uiController.updateStorageStatus('❌ Failed to store score');
            this.uiController.showAlert(
                'Failed to submit score: ' + error.message,
                ALERT_TYPES.ERROR
            );
            this.uiController.setStartButtonEnabled(true);
            this.uiController.updateGameStatus('Ready to play!');
        }
    }

    /**
     * Load player statistics
     * @private
     */
    async _loadPlayerStats() {
        try {
            if (this.web3Service.isDemoMode || !this.web3Service.contract) {
                // Load demo stats from localStorage
                this.uiController.updateStatsDemo();
                return;
            }

            // Load stats from blockchain
            const result = await this.web3Service.getPlayerStats();

            if (result.success && result.stats) {
                this.uiController.updateStats(result.stats);
            } else {
                console.warn('Failed to load player stats:', result.error);
                // Show zeros if stats can't be loaded
                this.uiController.updateStats({
                    totalScores: 0,
                    bestScore: 0,
                    totalClicks: 0
                });
            }

        } catch (error) {
            console.error('Failed to load player stats:', error);
            this.uiController.updateStats({
                totalScores: 0,
                bestScore: 0,
                totalClicks: 0
            });
        }
    }

    // ========== Public Methods ==========

    /**
     * Get current game state
     * @returns {string}
     */
    getGameState() {
        return this.gameEngine.getState();
    }

    /**
     * Get wallet connection status
     * @returns {boolean}
     */
    isWalletConnected() {
        return this.web3Service.isConnected();
    }

    /**
     * Get current score
     * @returns {number}
     */
    getCurrentScore() {
        return this.gameEngine.getClickCount();
    }

    /**
     * Get game statistics
     * @returns {Object}
     */
    getGameStats() {
        return this.gameEngine.getGameStats();
    }

    /**
     * Manually trigger wallet connection
     * @returns {Promise<void>}
     */
    async connectWallet() {
        await this._handleConnectWallet();
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.gameEngine.destroy();
        this.uiController.destroy();
        this.isInitialized = false;
    }
}

// ========== Initialize App on DOM Load ==========

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    
    // Make app globally accessible for debugging (optional)
    if (typeof window !== 'undefined') {
        window.clickerApp = app;
    }
});
