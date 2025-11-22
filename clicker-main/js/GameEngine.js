/**
 * GameEngine - Core game logic and state management
 * Handles countdown, gameplay timer, click tracking, and game lifecycle
 * @class GameEngine
 */

import { CONFIG, GAME_STATES } from './config.js';

export class GameEngine {
    constructor() {
        this.state = GAME_STATES.IDLE;
        this.clickCount = 0;
        this.timeLeft = CONFIG.GAME.DURATION;
        this.timerInterval = null;
        this.countdownInterval = null;
        this.gameStartTime = null;
        
        // Event handlers
        this.onStateChange = null;
        this.onTimerUpdate = null;
        this.onClickCountUpdate = null;
        this.onCountdownTick = null;
        this.onGameEnd = null;
    }

    /**
     * Start the game countdown
     */
    startCountdown() {
        if (this.state !== GAME_STATES.IDLE) {
            console.warn('Cannot start countdown. Game is not in idle state.');
            return;
        }

        this.state = GAME_STATES.COUNTDOWN;
        this._emitStateChange();

        let count = CONFIG.GAME.COUNTDOWN_START;
        
        // Emit initial countdown
        this._emitCountdownTick(count);

        this.countdownInterval = setInterval(() => {
            count--;
            
            if (count > 0) {
                this._emitCountdownTick(count);
            } else {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.startGameplay();
            }
        }, 1000);
    }

    /**
     * Start the actual gameplay
     */
    startGameplay() {
        this.state = GAME_STATES.PLAYING;
        this.clickCount = 0;
        this.timeLeft = CONFIG.GAME.DURATION;
        this.gameStartTime = Date.now();
        
        this._emitStateChange();
        this._emitClickCountUpdate();
        this._emitTimerUpdate();

        this.timerInterval = setInterval(() => {
            this.timeLeft -= CONFIG.GAME.TIMER_INTERVAL / 1000;
            
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.endGame();
            }
            
            this._emitTimerUpdate();
        }, CONFIG.GAME.TIMER_INTERVAL);
    }

    /**
     * Register a click
     * @returns {number} Updated click count
     */
    registerClick() {
        if (this.state !== GAME_STATES.PLAYING) {
            return this.clickCount;
        }

        this.clickCount++;
        this._emitClickCountUpdate();
        
        return this.clickCount;
    }

    /**
     * End the game
     */
    endGame() {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.state = GAME_STATES.FINISHED;
        this.timeLeft = 0;
        
        this._emitStateChange();
        this._emitTimerUpdate();
        
        // Emit game end with final score
        if (this.onGameEnd) {
            this.onGameEnd({
                score: this.clickCount,
                duration: CONFIG.GAME.DURATION,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Reset the game to idle state
     */
    reset() {
        // Clear any running intervals
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        // Reset state
        this.state = GAME_STATES.IDLE;
        this.clickCount = 0;
        this.timeLeft = CONFIG.GAME.DURATION;
        this.gameStartTime = null;

        this._emitStateChange();
    }

    /**
     * Get current game state
     * @returns {string}
     */
    getState() {
        return this.state;
    }

    /**
     * Get current click count
     * @returns {number}
     */
    getClickCount() {
        return this.clickCount;
    }

    /**
     * Get time remaining
     * @returns {number}
     */
    getTimeLeft() {
        return this.timeLeft;
    }

    /**
     * Get timer status (normal, warning, danger)
     * @returns {string}
     */
    getTimerStatus() {
        if (this.timeLeft <= CONFIG.GAME.DANGER_THRESHOLD) {
            return 'danger';
        } else if (this.timeLeft <= CONFIG.GAME.WARNING_THRESHOLD) {
            return 'warning';
        }
        return 'normal';
    }

    /**
     * Check if game is active
     * @returns {boolean}
     */
    isPlaying() {
        return this.state === GAME_STATES.PLAYING;
    }

    /**
     * Check if game is in countdown
     * @returns {boolean}
     */
    isCountdown() {
        return this.state === GAME_STATES.COUNTDOWN;
    }

    /**
     * Check if game is finished
     * @returns {boolean}
     */
    isFinished() {
        return this.state === GAME_STATES.FINISHED;
    }

    /**
     * Check if game is idle
     * @returns {boolean}
     */
    isIdle() {
        return this.state === GAME_STATES.IDLE;
    }

    /**
     * Get game statistics
     * @returns {Object}
     */
    getGameStats() {
        const duration = this.gameStartTime 
            ? (Date.now() - this.gameStartTime) / 1000 
            : 0;

        const cps = duration > 0 ? this.clickCount / duration : 0;

        return {
            score: this.clickCount,
            duration: duration,
            clicksPerSecond: cps.toFixed(2),
            state: this.state
        };
    }

    // ========== Event Emitters ==========

    /**
     * Emit state change event
     * @private
     */
    _emitStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.state);
        }
    }

    /**
     * Emit timer update event
     * @private
     */
    _emitTimerUpdate() {
        if (this.onTimerUpdate) {
            this.onTimerUpdate({
                timeLeft: this.timeLeft,
                status: this.getTimerStatus()
            });
        }
    }

    /**
     * Emit click count update event
     * @private
     */
    _emitClickCountUpdate() {
        if (this.onClickCountUpdate) {
            this.onClickCountUpdate(this.clickCount);
        }
    }

    /**
     * Emit countdown tick event
     * @private
     */
    _emitCountdownTick(count) {
        if (this.onCountdownTick) {
            this.onCountdownTick(count);
        }
    }

    // ========== Event Handler Setters ==========

    /**
     * Set state change handler
     * @param {Function} handler - Callback function
     */
    setOnStateChange(handler) {
        this.onStateChange = handler;
    }

    /**
     * Set timer update handler
     * @param {Function} handler - Callback function
     */
    setOnTimerUpdate(handler) {
        this.onTimerUpdate = handler;
    }

    /**
     * Set click count update handler
     * @param {Function} handler - Callback function
     */
    setOnClickCountUpdate(handler) {
        this.onClickCountUpdate = handler;
    }

    /**
     * Set countdown tick handler
     * @param {Function} handler - Callback function
     */
    setOnCountdownTick(handler) {
        this.onCountdownTick = handler;
    }

    /**
     * Set game end handler
     * @param {Function} handler - Callback function
     */
    setOnGameEnd(handler) {
        this.onGameEnd = handler;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.onStateChange = null;
        this.onTimerUpdate = null;
        this.onClickCountUpdate = null;
        this.onCountdownTick = null;
        this.onGameEnd = null;
    }
}
