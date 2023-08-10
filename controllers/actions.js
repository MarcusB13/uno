function Draw(nextPlayer, deck, numberOfCards) {
    let cardsDrawn = [];

    for (let index = 0; index < numberOfCards; index++) {
        let cardToDraw = deck.shift();
        nextPlayer.push(cardToDraw);
        cardsDrawn.push(cardToDraw);
    }

    return [nextPlayer, cardsDrawn]
}


module.exports = {
    Draw
}