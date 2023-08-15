const fs = require('fs');
const bodyParser = require('body-parser');

const express = require('express')
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 80;

const { CreateDeck, CreatePlayer, DrawCard, LayCards, GetNextPlayer, ResetDeckWithUsedCards } = require('./controllers/cards.js');
const { Draw } = require('./controllers/actions.js');
const { CanRequestProceed } = require('./controllers/game.js');

// Game Variables
var players = {};
var deck = [];
var usedCards = [];
var gameStarted = false;
var usedCardsColor = "";
var currentPlayersTurn = "";

var gamePassword = "";

app.post('/create-game', (req, res) => {
    if (!gamePassword == ""){
        return res.status(400).json({ message: "A game already exists" });
    }

    gamePassword = Math.random().toString(36);
    
    [tempDeck, tempUsedCard, color] = CreateDeck();
    deck = tempDeck;
    usedCardsColor = color;
    usedCards.push(tempUsedCard);

    players["player1"] = CreatePlayer(deck);
    res.json({"cards": players["player1"], "code": gamePassword})
})

app.post('/join-game',  (req, res) => {
    const { secret } = req.body;

    if (secret !== gamePassword) {
        return res.status(400).json({ message: 'Invalid game pass' });
    }
    
    var numberOfPlayers = Object.keys(players).length;
    if (numberOfPlayers >= 4) {
        return res.status(400).json({ message: 'Max number of players reached' });
    }
    
    playerNumber = numberOfPlayers + 1;
    playerName = "player" + playerNumber;

    players[playerName] = CreatePlayer(deck);
    res.json({ "cards": players[playerName] });
});

app.get('/start-game',  (req, res) => {
    if(gameStarted){
        return res.json(deck);
    }
    gameStarted = true;
    currentPlayersTurn = Object.keys(players)[0];

    res.json({ currentPlayersTurn, usedCardsColor });
})

app.get('/get-deck',  (req, res) => {
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

app.get('/whos-turn',  (req, res) => {
    res.json({"player": currentPlayersTurn});
})

app.get('/top-card',  (req, res) => {
    res.json({"card": usedCards[0]});
})

app.post("/player-hand", (req, res) => {
    const { player } = req.body;
    let [error, canProceed] = CanRequestProceed(player, gameStarted, currentPlayersTurn);
    if (!canProceed){
        res.status(400).send(error)
        return;
    }
    res.json(players[player]);
})

app.post("/draw-card", (req, res) => {
    const { player } = req.body;
    let [error, canProceed] = CanRequestProceed(player, gameStarted, currentPlayersTurn);
    if (!canProceed){
        res.status(400).send(error)
        return;
    }

    if (deck.length <= 4){
        var [tempDeck, tempUsedCards] = ResetDeckWithUsedCards(deck, usedCards);
        deck = tempDeck
        usedCards = tempUsedCards
    }
    const card = DrawCard(deck, players[player]);
    res.json(card);
})

app.post("/lay-cards", (req, res) => {
    const { player, card, color } = req.body;
    let [error, canProceed] = CanRequestProceed(player, gameStarted, currentPlayersTurn);
    if (!canProceed){
        res.status(400).send(error)
        return;
    }

    try{
        var [tempPlayer, cardColor, action, isAction] = LayCards(players[player], card, usedCards, usedCardsColor, color, res);
        usedCardsColor = cardColor;
        players[player] = tempPlayer;
    } catch (err) {
        return;
    }

    if (isAction){
        let nextPlayerName = GetNextPlayer(player, players);
        let nextPlayer = players[nextPlayerName];

        switch (action.toLowerCase()) {
            case "draw2":
                let tempNextPlayerDraw2 = Draw(nextPlayer, deck, 2);
                players[nextPlayer] = tempNextPlayerDraw2;
                currentPlayersTurn = GetNextPlayer(player, players);
                return res.json({"player": players[player], "color": usedCardsColor});

            case "draw4":
                let tempNextPlayerDraw4 = Draw(nextPlayer, deck, 4);
                players[nextPlayer] = tempNextPlayerDraw4;
                currentPlayersTurn = GetNextPlayer(player, players);
                return res.json({"player": players[player],  "color": usedCardsColor});

            case "reverse":
                tempPlayers = {};
                Object.keys(players).reverse().forEach(obj => {
                    tempPlayers[obj] = players[obj]
                })
                players = tempPlayers;
                currentPlayersTurn = GetNextPlayer(player, players);
                return res.json({"player": players[player],  "color": usedCardsColor});
            
            case "skip":
                currentPlayersTurn = GetNextPlayer(currentPlayersTurn, players);
                currentPlayersTurn = GetNextPlayer(currentPlayersTurn, players);
                return res.json({"player": players[player],  "color": usedCardsColor});    
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
