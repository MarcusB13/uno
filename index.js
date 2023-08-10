const fs = require('fs');
const bodyParser = require('body-parser');

const express = require('express')
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 80;

const { CreateDeck, CreatePlayerDeck, DrawCard, LayCards, GetNextPlayer } = require('./controllers/cards.js');
const { Draw } = require('./controllers/actions.js');

var players = {};
var deck = [];
var usedCards = [];
var gameStarted = false;
var usedCardsColor = "";


app.get('/start-game', async (req, res) => {
    if(gameStarted){
        res.json(deck);
        return
    }
    [tempDeck, tempUsedCard, color] = CreateDeck();
    deck = tempDeck;
    usedCardsColor = color;
    usedCards.push(tempUsedCard);

    var tempPlayers = CreatePlayerDeck(deck, 2)
    players = tempPlayers;

    gameStarted = true;
    console.log("Game started, start color is: " + usedCardsColor)
    res.json(deck);
})

app.get('/get-deck', async (req, res) => {
    res.json(deck);
})

app.get("/reset-game", (req, res) => {
    player1 = [];
    player2 = [];
    deck = [];
    usedCards = [];
    gameStarted = false;
    res.send("Game reset");
})

app.post("/player-hand", (req, res) => {
    if(!gameStarted){
        res.status(400).send("Game has not started yet");
    }
    const { player } = req.body;
    res.json(players[player]);
})

app.post("/draw-card", (req, res) => {
    const { player } = req.body;
    const card = DrawCard(deck, players[player]);
    res.json(card);
})

app.post("/lay-cards", (req, res) => {
    const { player, card, color } = req.body;
    try{
        var [tempPlayer, cardColor, action, isAction] = LayCards(players[player], card, usedCards, usedCardsColor, color, res);
    } catch (err) {
        return;
    }

    if (isAction){
        let nextPlayerName = GetNextPlayer(player, players);
        let nextPlayer = players[nextPlayerName];

        switch (action.toLowerCase()) {
            case "draw2":
                let [tempNextPlayerDraw2, cardsDrawn2] = Draw(nextPlayer, deck, 2);
                players[nextPlayer] = tempNextPlayerDraw2;
                break;

            case "draw4":
                let [tempNextPlayerDraw4, cardsDrawn4] = Draw(nextPlayer, deck, 4);
                players[nextPlayer] = tempNextPlayerDraw4;
                break;

            case "reverse":

                break;
            
            case "skip":
        }
    }
})


Array.prototype.shuffle = function() {
    var i = this.length, j, temp;
    if ( i == 0 ) return this;
    while ( --i ) {
       j = Math.floor( Math.random() * ( i + 1 ) );
       temp = this[i];
       this[i] = this[j];
       this[j] = temp;
    }
    return this;
}

app.listen(port);
