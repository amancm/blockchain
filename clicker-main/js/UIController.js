/**
 * UIController - Manages all DOM interactions and UI updates
 * Handles rendering, animations, and user interactions
 * @class UIController
 */

import { CONFIG, ALERT_TYPES } from './config.js';

export class UIController {
    constructor() {
        this.elements = this._initializeElements();
        this.alertContainer = null;
    }

    /**
     * Initialize and cache DOM elements
     * @private
     * @returns {Object} Map of DOM elements
     */
    _initializeElements() {
        return {
            // Header elements
            connectBtn: document.getElementById('connectBtn'),
            walletBadge: document.getElementById('walletBadge'),
            networkBadge: document.getElementById('networkBadge'),
            walletAddress: document.getElementById('walletAddress'),
            
            // Stats panel elements
            bestScore: document.getElementById('bestScore'),
            totalGames: document.getElementById('totalGames'),
            totalClicks: document.getElementById('totalClicks'),
            onChainScores: document.getElementById('onChainScores'),
            
            // Game area elements
            timer: document.getElementById('timer'),
            clickCount: document.getElementById('clickCount'),
            gameStatus: document.getElementById('gameStatus'),
            clickBtn: document.getElementById('clickBtn'),
            startBtn: document.getElementById('startBtn'),
            
            // Countdown overlay
            countdownOverlay: document.getElementById('countdownOverlay'),
            countdownNumber: document.getElementById('countdownNumber'),
            
            // Results modal
            resultsModal: document.getElementById('resultsModal'),
            finalScore: document.getElementById('finalScore'),
            storageStatus: document.getElementById('storageStatus'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            
            // Alert container
            alertContainer: document.getElementById('alertContainer') || this._createAlertContainer()
        };
    }

    /**
     * Create alert container if it doesn't exist
     * @private
     * @returns {HTMLElement}
     */
    _createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    // ========== Wallet UI Methods ==========

    /**
     * Update wallet connection UI
     * @param {boolean} connected - Connection status
     * @param {string|null} address - Wallet address
     */
    updateWalletUI(connected, address = null) {
        if (connected && address) {
            this.elements.walletAddress.textContent = this._formatAddress(address);
            this.elements.walletBadge.style.display = 'block';
            this.elements.networkBadge.style.display = 'block';
            this.elements.connectBtn.style.display = 'none';
            this.elements.startBtn.disabled = false;
        } else {
            this.elements.walletBadge.style.display = 'none';
            this.elements.networkBadge.style.display = 'none';
            this.elements.connectBtn.style.display = 'block';
            this.elements.startBtn.disabled = true;
        }
    }

    /**
     * Format wallet address
     * @private
     * @param {string} address - Full wallet address
     * @returns {string} Formatted address
     */
    _formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // ========== Stats UI Methods ==========

    /**
     * Update player statistics display
     * @param {Object} stats - Player statistics
     */
    updateStats(stats) {
        this.elements.bestScore.textContent = stats.bestScore || '0';
        this.elements.totalGames.textContent = stats.totalScores || '0';
        this.elements.totalClicks.textContent = stats.totalClicks || '0';
        this.elements.onChainScores.textContent = stats.totalScores || '0';
    }

    /**
     * Update stats for demo mode
     */
    updateStatsDemo() {
        const demoStats = this._loadDemoStats();
        this.elements.bestScore.textContent = demoStats.bestScore;
        this.elements.totalGames.textContent = demoStats.totalScores;
        this.elements.totalClicks.textContent = demoStats.totalClicks;
        this.elements.onChainScores.textContent = '0 (Demo)';
    }

    /**
     * Load demo stats from localStorage
     * @private
     * @returns {Object}
     */
    _loadDemoStats() {
        const defaultStats = {
            totalScores: 0,
            bestScore: 0,
            totalClicks: 0
        };
        
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYER_STATS);
            return stored ? JSON.parse(stored) : defaultStats;
        } catch (error) {
            console.error('Failed to load demo stats:', error);
            return defaultStats;
        }
    }

    /**
     * Save demo stats to localStorage
     * @param {number} score - Game score
     */
    saveDemoStats(score) {
        const stats = this._loadDemoStats();
        stats.totalScores++;
        stats.totalClicks += score;
        if (score > stats.bestScore) {
            stats.bestScore = score;
        }
        
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
            this.updateStatsDemo();
        } catch (error) {
            console.error('Failed to save demo stats:', error);
        }
    }

    // ========== Game UI Methods ==========

    /**
     * Update timer display
     * @param {number} timeLeft - Time remaining in seconds
     * @param {string} status - Timer status (normal, warning, danger)
     */
    updateTimer(timeLeft, status = 'normal') {
        this.elements.timer.textContent = timeLeft.toFixed(1);
        this.elements.timer.className = `game__timer ${status !== 'normal' ? `game__timer--${status}` : ''}`;
    }

    /**
     * Update click count display
     * @param {number} count - Current click count
     */
    updateClickCount(count) {
        this.elements.clickCount.textContent = count;
    }

    /**
     * Update game status message
     * @param {string} message - Status message
     */
    updateGameStatus(message) {
        this.elements.gameStatus.textContent = message;
    }

    /**
     * Enable/disable click button
     * @param {boolean} enabled - Button state
     */
    setClickButtonEnabled(enabled) {
        this.elements.clickBtn.disabled = !enabled;
    }

    /**
     * Enable/disable start button
     * @param {boolean} enabled - Button state
     */
    setStartButtonEnabled(enabled) {
        this.elements.startBtn.disabled = !enabled;
    }

    /**
     * Reset game UI to initial state
     */
    resetGameUI() {
        this.updateTimer(CONFIG.GAME.DURATION, 'normal');
        this.updateClickCount(0);
        this.updateGameStatus('Ready to play!');
        this.setClickButtonEnabled(false);
        this.setStartButtonEnabled(true);
    }

    // ========== Countdown UI Methods ==========

    /**
     * Show countdown overlay
     * @param {number} count - Countdown number
     */
    showCountdown(count) {
        this.elements.countdownNumber.textContent = count;
        this.elements.countdownOverlay.classList.add('countdown-overlay--show');
    }

    /**
     * Hide countdown overlay
     */
    hideCountdown() {
        this.elements.countdownOverlay.classList.remove('countdown-overlay--show');
    }

    /**
     * Update countdown number
     * @param {number} count - Countdown number
     */
    updateCountdown(count) {
        this.elements.countdownNumber.textContent = count;
    }

    // ========== Modal UI Methods ==========

    /**
     * Show results modal
     * @param {number} score - Final score
     * @param {string} statusMessage - Storage status message
     */
    showResultsModal(score, statusMessage = 'Processing...') {
        this.elements.finalScore.textContent = score;
        this.elements.storageStatus.textContent = statusMessage;
        this.elements.resultsModal.classList.add('modal--show');
    }

    /**
     * Hide results modal
     */
    hideResultsModal() {
        this.elements.resultsModal.classList.remove('modal--show');
    }

    /**
     * Update storage status in modal
     * @param {string} message - Status message
     */
    updateStorageStatus(message) {
        this.elements.storageStatus.textContent = message;
    }

    // ========== Alert Methods ==========

    /**
     * Show alert notification
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, error, warning, info)
     */
    showAlert(message, type = ALERT_TYPES.ERROR) {
        const alert = document.createElement('div');
        alert.className = `alert alert--${type}`;
        alert.textContent = message;
        
        this.elements.alertContainer.appendChild(alert);
        
        // Auto-remove after duration
        setTimeout(() => {
            alert.remove();
        }, CONFIG.ALERT.DURATION);
    }

    // ========== Event Binding Methods ==========

    /**
     * Bind click event to connect button
     * @param {Function} handler - Event handler
     */
    onConnectClick(handler) {
        this.elements.connectBtn.addEventListener('click', handler);
    }

    /**
     * Bind click event to start button
     * @param {Function} handler - Event handler
     */
    onStartClick(handler) {
        this.elements.startBtn.addEventListener('click', handler);
    }

    /**
     * Bind click event to click button
     * @param {Function} handler - Event handler
     */
    onClickButtonClick(handler) {
        this.elements.clickBtn.addEventListener('click', handler);
    }

    /**
     * Bind click event to play again button
     * @param {Function} handler - Event handler
     */
    onPlayAgainClick(handler) {
        this.elements.playAgainBtn.addEventListener('click', handler);
    }

    // ========== Utility Methods ==========

    /**
     * Add loading spinner to element
     * @param {HTMLElement} element - Target element
     */
    addLoadingSpinner(element) {
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        element.appendChild(spinner);
    }

    /**
     * Remove loading spinner from element
     * @param {HTMLElement} element - Target element
     */
    removeLoadingSpinner(element) {
        const spinner = element.querySelector('.spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    getElement(id) {
        return this.elements[id] || document.getElementById(id);
    }

    /**
     * Check if element exists
     * @param {string} id - Element ID
     * @returns {boolean}
     */
    hasElement(id) {
        return this.elements[id] !== null && this.elements[id] !== undefined;
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Remove event listeners if needed
        // Clear references
        this.elements = null;
    }
}
