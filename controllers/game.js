function CanRequestProceed(player, currentPlayersTurn){
    if (!player === currentPlayersTurn){
        return ["It is not your turn", false]
    }
    return ["", true]
}     


module.exports = {
    CanRequestProceed
}