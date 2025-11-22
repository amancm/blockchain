// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleClickerScores
 * @dev A simple smart contract to store clicker game scores on-chain
 */
contract SimpleClickerScores {
    
    // Player score entry
    struct ScoreEntry {
        uint256 score;
        uint256 timestamp;
    }
    
    // Mapping from player address to their scores
    mapping(address => ScoreEntry[]) public playerScores;
    
    // Mapping from player to their best score
    mapping(address => uint256) public playerBestScore;
    
    // Mapping from player to total clicks
    mapping(address => uint256) public playerTotalClicks;
    
    // Events
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    
    /**
     * @dev Submit a new score
     * @param _clicks Number of clicks achieved in the game
     */
    function submitScore(uint256 _clicks) external {
        require(_clicks > 0 && _clicks <= 1000, "Invalid score");
        
        // Store the score
        playerScores[msg.sender].push(ScoreEntry({
            score: _clicks,
            timestamp: block.timestamp
        }));
        
        // Update best score if needed
        if (_clicks > playerBestScore[msg.sender]) {
            playerBestScore[msg.sender] = _clicks;
        }
        
        // Update total clicks
        playerTotalClicks[msg.sender] += _clicks;
        
        emit ScoreSubmitted(msg.sender, _clicks, block.timestamp);
    }
    
    /**
     * @dev Get all scores for a player
     * @param _player Address of the player
     * @return Array of scores
     */
    function getPlayerScores(address _player) external view returns (uint256[] memory) {
        uint256 length = playerScores[_player].length;
        uint256[] memory scores = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            scores[i] = playerScores[_player][i].score;
        }
        
        return scores;
    }
    
    /**
     * @dev Get player statistics
     * @param _player Address of the player
     * @return totalScores Number of games played
     * @return bestScore Best score achieved
     * @return totalClicks Total clicks across all games
     */
    function getPlayerStats(address _player) external view returns (
        uint256 totalScores,
        uint256 bestScore,
        uint256 totalClicks
    ) {
        totalScores = playerScores[_player].length;
        bestScore = playerBestScore[_player];
        totalClicks = playerTotalClicks[_player];
    }
    
    /**
     * @dev Get a specific score entry for a player
     * @param _player Address of the player
     * @param _index Index of the score to retrieve
     * @return score The score value
     * @return timestamp When the score was recorded
     */
    function getScoreAtIndex(address _player, uint256 _index) external view returns (
        uint256 score,
        uint256 timestamp
    ) {
        require(_index < playerScores[_player].length, "Index out of bounds");
        ScoreEntry memory entry = playerScores[_player][_index];
        return (entry.score, entry.timestamp);
    }
    
    /**
     * @dev Get the total number of scores for a player
     * @param _player Address of the player
     * @return Number of scores recorded
     */
    function getScoreCount(address _player) external view returns (uint256) {
        return playerScores[_player].length;
    }
}
