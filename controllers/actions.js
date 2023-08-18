function Draw(nextPlayer, deck, numberOfCards) {
    for (let index = 0; index < numberOfCards; index++) {
        let cardToDraw = deck.shift();
        nextPlayer.push(cardToDraw);
    }
    nextPlayer.sort()
    return nextPlayer
}


module.exports = {
    Draw
}