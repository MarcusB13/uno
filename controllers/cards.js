const fs = require('fs');
const path = require('path');

let cardsFile = fs.readFileSync(path.join(__dirname, "..", "cards.json"));

function CreateDeck(){
    fullDeck = JSON.parse(cardsFile).fullDeck;
    fullDeck = fullDeck.shuffle();

    let firstUsedCard = fullDeck.shift()
    let firstUsedCardColor = GetCardColors(firstUsedCard);
    return [fullDeck, firstUsedCard, firstUsedCardColor];
}

function CreatePlayer(deck){
    let player = [];

    for(let cardNumber = 0; cardNumber < 7; cardNumber++){
        let card = deck.shift();
        player.push(card)
    }

    return player;
}

function DrawCard(deck, player){
    let card = deck.shift();
    player.push(card);
    return card;
}

function GetCardColors(card){
    let fullDeck = JSON.parse(cardsFile).fullDeck;
    let fullDeckColors = JSON.parse(cardsFile).fullDeckColors;

    let cardIndex = fullDeck.indexOf(card);
    let cardColor = fullDeckColors[cardIndex];
    return cardColor;
}

function IsWild(card){
    let wildCards = JSON.parse(cardsFile).wilds;
    if (wildCards.includes(card)) {
        return true;
    } else {
        return false;
    }
}

function ActionCard(card){
    let actionCards = JSON.parse(cardsFile).actionCards;

    if (actionCards.includes(card)) {
        let actionCardsWithoutColor = JSON.parse(cardsFile).actionCardsWithoutColor;
        let actionCardIndex = actionCards.indexOf(card);
        let actionCard = actionCardsWithoutColor[actionCardIndex];

        return [true, actionCard];
    } else {
        return [false, ""];
    }
}

function GetNextPlayer(currentPlayer, players){
    players =  Object.keys(players)
    let indexOfCurrentPlayer = players.indexOf(currentPlayer);
    let indexOfNextPlayer = indexOfCurrentPlayer + 1;
    
    let nextPlayer = players[indexOfNextPlayer ? indexOfNextPlayer : 0];
    return nextPlayer;
}

function LayCards(player, card, usedCards, PreviousColor, wildCardColor, res){
    if(!player.includes(card)){
        return res.status(400).send("Player does not have this card");
    }

    let cardColor = GetCardColors(card);
    if(!IsWild(card)){
        if(cardColor != PreviousColor){
            return res.status(400).send("Card color does not match previous card color");
        }
    } else {
        cardColor = wildCardColor;
    }
    
    let cardIndex = player.indexOf(card);
    player.splice(cardIndex, cardIndex + 1);
    usedCards.push(card);

    let [isAction, action] = ActionCard(card)
    return [player, cardColor, action, isAction];
}

function ResetDeckWithUsedCards(deck, usedCards){
    const topCard = usedCards.shift();
    deck = deck.concat(usedCards);
    deck.shuffle();
    usedCards = [topCard];

    return [tempDeck, tempUsedCards]
}

module.exports = {
    CreateDeck,
    CreatePlayer,
    DrawCard,
    LayCards,
    GetNextPlayer,
    ResetDeckWithUsedCards
}