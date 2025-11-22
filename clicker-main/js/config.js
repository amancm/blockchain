/**
 * Configuration constants for the Clicker Challenge application
 * @module config
 */

export const CONFIG = {
    // Smart Contract Configuration
    CONTRACT_ADDRESS: "0x08e2603548511aA1d1063Af007Cb2528D45c19CA",
    
    // Network Configuration
    SEPOLIA: {
        CHAIN_ID: "0xaa36a7", // 11155111 in hex
        CHAIN_ID_DEC: 11155111,
        NAME: "Sepolia Testnet",
        CURRENCY: {
            NAME: "ETH",
            SYMBOL: "ETH",
            DECIMALS: 18
        },
        RPC_URL: "https://rpc.sepolia.org",
        EXPLORER_URL: "https://sepolia.etherscan.io"
    },
    
    // Game Configuration
    GAME: {
        DURATION: 10.0, // seconds
        TIMER_INTERVAL: 100, // milliseconds
        WARNING_THRESHOLD: 6.0, // seconds
        DANGER_THRESHOLD: 3.0, // seconds
        COUNTDOWN_START: 3, // seconds
        MIN_SCORE: 1,
        MAX_SCORE: 1000
    },
    
    // Alert Configuration
    ALERT: {
        DURATION: 5000 // milliseconds
    },
    
    // LocalStorage Keys
    STORAGE_KEYS: {
        PLAYER_STATS: 'playerStats'
    }
};

/**
 * Smart Contract ABI
 * @constant {Array<string>}
 */
export const CONTRACT_ABI = [
    "function submitScore(uint256 _clicks) external",
    "function getPlayerScores(address _player) external view returns (uint256[] memory)",
    "function getPlayerStats(address _player) external view returns (uint256 totalScores, uint256 bestScore, uint256 totalClicks)",
    "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)"
];

/**
 * Alert types for UI notifications
 * @constant {Object}
 */
export const ALERT_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

/**
 * Game states
 * @constant {Object}
 */
export const GAME_STATES = {
    IDLE: 'idle',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    FINISHED: 'finished'
};

/**
 * Connection states
 * @constant {Object}
 */
export const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};
