const fs = require('fs');
const bodyParser = require('body-parser');

const express = require('express')
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 80;

const { CreateDeck, CreatePlayerDeck, DrawCard, LayCards, GetNextPlayer } = require('./controllers/cards.js');
const { Draw } = require('./controllers/actions.js');
const { CanRequestProceed } = require('./controllers/game.js');

var players = {};
var deck = [];
var usedCards = [];
var gameStarted = false;
var usedCardsColor = "";
var currentPlayersTurn = "";


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
    currentPlayersTurn = Object.keys(players)[0];
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

app.get('/whos-turn', async (req, res) => {
    res.json({"player": currentPlayersTurn});
})

app.get('/top-card', async (req, res) => {
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

// TODO: 

// Add a shuffle endpoint 
// (For when there is no cards left in the deck. 
// Shuffle the used cards and make them the new deck
// But keep the top card as the top card in used cards)

// Add a Join Game endpoint.
// This will allow a player to join the game.
// The start-game should be used by the first player. 
// And only create one player inside of players.
// Join Game should then create more players inside of players.
// And draw 7 cards for that player.
// For join game people will send a username along
// So in players we now longer use player1, player2 etc.
// But instead we use the username that the player sent along 

// Maybe rename the start-game endpoint to create-game
// And then create a start-game endpoint that will start the game
// And make the start game deal the first 7 cards to each player




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
