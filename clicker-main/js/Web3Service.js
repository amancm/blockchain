/**
 * Web3Service - Handles all blockchain interactions
 * Manages wallet connections, network switching, and smart contract operations
 * @class Web3Service
 */

import { CONFIG, CONTRACT_ABI, CONNECTION_STATES } from './config.js';

export class Web3Service {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.walletAddress = null;
        this.state = CONNECTION_STATES.DISCONNECTED;
        this.isDemoMode = false;
        
        this._initializeEventListeners();
    }

    /**
     * Initialize MetaMask event listeners
     * @private
     */
    _initializeEventListeners() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', this._handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this._handleChainChanged.bind(this));
        }
    }

    /**
     * Handle MetaMask account changes
     * @private
     */
    _handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this._reset();
            window.location.reload();
        } else {
            window.location.reload();
        }
    }

    /**
     * Handle network changes
     * @private
     */
    _handleChainChanged() {
        window.location.reload();
    }

    /**
     * Reset service state
     * @private
     */
    _reset() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.walletAddress = null;
        this.state = CONNECTION_STATES.DISCONNECTED;
    }

    /**
     * Check if MetaMask is installed
     * @returns {boolean}
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Check if wallet is connected
     * @returns {boolean}
     */
    isConnected() {
        return this.state === CONNECTION_STATES.CONNECTED && this.walletAddress !== null;
    }

    /**
     * Get formatted wallet address
     * @returns {string|null}
     */
    getFormattedAddress() {
        if (!this.walletAddress) return null;
        return `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
    }

    /**
     * Connect to MetaMask wallet
     * @returns {Promise<{success: boolean, address: string|null, error: string|null}>}
     */
    async connect() {
        if (!this.isMetaMaskInstalled()) {
            return {
                success: false,
                address: null,
                error: 'MetaMask is not installed. Please install MetaMask to continue.'
            };
        }

        try {
            this.state = CONNECTION_STATES.CONNECTING;

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.walletAddress = await this.signer.getAddress();

            // Ensure correct network
            const networkResult = await this._ensureCorrectNetwork();
            if (!networkResult.success) {
                this._reset();
                return networkResult;
            }

            // Initialize contract
            this._initializeContract();

            this.state = CONNECTION_STATES.CONNECTED;

            return {
                success: true,
                address: this.walletAddress,
                error: null
            };

        } catch (error) {
            console.error('Connection error:', error);
            this._reset();
            this.state = CONNECTION_STATES.ERROR;
            
            return {
                success: false,
                address: null,
                error: error.message || 'Failed to connect wallet'
            };
        }
    }

    /**
     * Ensure user is on Sepolia network
     * @private
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async _ensureCorrectNetwork() {
        try {
            const network = await this.provider.getNetwork();
            
            if (network.chainId !== CONFIG.SEPOLIA.CHAIN_ID_DEC) {
                return await this._switchOrAddNetwork();
            }

            return { success: true, error: null };

        } catch (error) {
            console.error('Network check error:', error);
            return {
                success: false,
                error: 'Failed to verify network'
            };
        }
    }

    /**
     * Switch to Sepolia or add it if not present
     * @private
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async _switchOrAddNetwork() {
        try {
            // Try switching network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.SEPOLIA.CHAIN_ID }],
            });

            // Refresh provider after switch
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            return { success: true, error: null };

        } catch (switchError) {
            // Network not added, try adding it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: CONFIG.SEPOLIA.CHAIN_ID,
                            chainName: CONFIG.SEPOLIA.NAME,
                            nativeCurrency: CONFIG.SEPOLIA.CURRENCY,
                            rpcUrls: [CONFIG.SEPOLIA.RPC_URL],
                            blockExplorerUrls: [CONFIG.SEPOLIA.EXPLORER_URL]
                        }]
                    });

                    // Refresh provider after adding
                    this.provider = new ethers.providers.Web3Provider(window.ethereum);
                    this.signer = this.provider.getSigner();

                    return { success: true, error: null };

                } catch (addError) {
                    console.error('Add network error:', addError);
                    return {
                        success: false,
                        error: 'Failed to add Sepolia network'
                    };
                }
            }

            return {
                success: false,
                error: 'Please switch to Sepolia network manually'
            };
        }
    }

    /**
     * Initialize smart contract instance
     * @private
     */
    _initializeContract() {
        if (CONFIG.CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
            this.isDemoMode = true;
            this.contract = null;
            console.warn('Contract not deployed. Running in demo mode.');
        } else {
            this.contract = new ethers.Contract(
                CONFIG.CONTRACT_ADDRESS,
                CONTRACT_ABI,
                this.signer
            );
            this.isDemoMode = false;
        }
    }

    /**
     * Submit score to blockchain
     * @param {number} score - The score to submit
     * @returns {Promise<{success: boolean, txHash: string|null, error: string|null}>}
     */
    async submitScore(score) {
        if (this.isDemoMode || !this.contract) {
            return {
                success: false,
                txHash: null,
                error: 'Contract not available. Running in demo mode.'
            };
        }

        if (score < CONFIG.GAME.MIN_SCORE || score > CONFIG.GAME.MAX_SCORE) {
            return {
                success: false,
                txHash: null,
                error: `Invalid score. Must be between ${CONFIG.GAME.MIN_SCORE} and ${CONFIG.GAME.MAX_SCORE}`
            };
        }

        try {
            const tx = await this.contract.submitScore(score);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.transactionHash,
                error: null
            };

        } catch (error) {
            console.error('Submit score error:', error);
            return {
                success: false,
                txHash: null,
                error: error.reason || error.message || 'Failed to submit score'
            };
        }
    }

    /**
     * Get player statistics from blockchain
     * @param {string} address - Player address (optional, defaults to connected wallet)
     * @returns {Promise<{success: boolean, stats: Object|null, error: string|null}>}
     */
    async getPlayerStats(address = null) {
        const targetAddress = address || this.walletAddress;

        if (!targetAddress) {
            return {
                success: false,
                stats: null,
                error: 'No wallet address available'
            };
        }

        if (this.isDemoMode || !this.contract) {
            return {
                success: false,
                stats: null,
                error: 'Contract not available'
            };
        }

        try {
            const stats = await this.contract.getPlayerStats(targetAddress);

            return {
                success: true,
                stats: {
                    totalScores: stats.totalScores.toNumber(),
                    bestScore: stats.bestScore.toNumber(),
                    totalClicks: stats.totalClicks.toNumber()
                },
                error: null
            };

        } catch (error) {
            console.error('Get player stats error:', error);
            return {
                success: false,
                stats: null,
                error: error.message || 'Failed to load player stats'
            };
        }
    }

    /**
     * Get all player scores from blockchain
     * @param {string} address - Player address (optional, defaults to connected wallet)
     * @returns {Promise<{success: boolean, scores: Array|null, error: string|null}>}
     */
    async getPlayerScores(address = null) {
        const targetAddress = address || this.walletAddress;

        if (!targetAddress) {
            return {
                success: false,
                scores: null,
                error: 'No wallet address available'
            };
        }

        if (this.isDemoMode || !this.contract) {
            return {
                success: false,
                scores: null,
                error: 'Contract not available'
            };
        }

        try {
            const scores = await this.contract.getPlayerScores(targetAddress);
            const scoreNumbers = scores.map(s => s.toNumber());

            return {
                success: true,
                scores: scoreNumbers,
                error: null
            };

        } catch (error) {
            console.error('Get player scores error:', error);
            return {
                success: false,
                scores: null,
                error: error.message || 'Failed to load player scores'
            };
        }
    }

    /**
     * Get current network info
     * @returns {Promise<{chainId: number, name: string}>}
     */
    async getNetworkInfo() {
        if (!this.provider) {
            return null;
        }

        try {
            const network = await this.provider.getNetwork();
            return {
                chainId: network.chainId,
                name: network.name
            };
        } catch (error) {
            console.error('Get network info error:', error);
            return null;
        }
    }

    /**
     * Get wallet balance
     * @returns {Promise<string|null>} Balance in ETH
     */
    async getBalance() {
        if (!this.provider || !this.walletAddress) {
            return null;
        }

        try {
            const balance = await this.provider.getBalance(this.walletAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Get balance error:', error);
            return null;
        }
    }
}
