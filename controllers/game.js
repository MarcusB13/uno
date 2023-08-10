function CanRequestProceed(player, gameStarted, currentPlayersTurn){
    if (!gameStarted){
        return ["Game has not started yet", false]
    }
    if (player != currentPlayersTurn){
        return ["It is not your turn", false]
    }
    return ["", true]
}     


module.exports = {
    CanRequestProceed
}