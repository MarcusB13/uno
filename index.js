const fs = require('fs');
const bodyParser = require('body-parser');



const express = require('express')
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 3000;

const { CreateDeck, CreatePlayer, DrawCard, LayCards, GetNextPlayer, ResetDeckWithUsedCards } = require('./controllers/cards.js');
const { Draw } = require('./controllers/actions.js');
const { CanRequestProceed } = require('./controllers/game.js');

const server  = require("http").createServer(app)
const io = require("socket.io")(server, {cors: {origin: "*"}})


// Game Variables
var players = {};
var deck = [];
var usedCards = [];
var gameStarted = false;
var usedCardsColor = "";
var currentPlayersTurn = "";

var gamePassword = "";

io.on("connection", (socket) => {
    console.log("Connected")

    socket.on("create-game", (data) => {
        console.log("Create game")

        // if (!gamePassword == ""){
        //     socket.emit("error", { message: "A game already exists" });
        //     return;
        // }
    
        gamePassword = Math.random().toString(36);
        
        [tempDeck, tempUsedCard, color] = CreateDeck();
        deck = tempDeck;
        usedCardsColor = color;
        usedCards.push(tempUsedCard);
    
        players["player1"] = CreatePlayer(deck);
        socket.emit("create-game", {"cards": players["player1"].sort(), "code": gamePassword})
    })

    socket.on("join-game", (secret) => {
        if (secret !== gamePassword) {
            return socket.emit("error", { message: 'Invalid game pass' });
        }
        
        var numberOfPlayers = Object.keys(players).length;
        if (numberOfPlayers >= 4) {
            return res.status(400).json({ message: 'Max number of players reached' });
        }
    
        playerNumber = numberOfPlayers + 1;
        playerName = "player" + playerNumber;
    
        players[playerName] = CreatePlayer(deck);
        socket.emit("join-game", { "cards": players[playerName].sort(), "playerName": [playerName]});
        io.emit("set-top-card", {"card": usedCards[0]})
        io.emit("set-turn", {"whosTurn": currentPlayersTurn})
    })

    socket.on("start-game", (secret) => {
        if (secret !== gamePassword) {
            return socket.emit("error", { message: 'Invalid game pass' });
        }
    
        if(gameStarted){
            return res.json(deck);
        }
        gameStarted = true;
        currentPlayersTurn = Object.keys(players)[0];
    
        io.emit("start-game", { currentPlayersTurn, usedCardsColor, "topCard": usedCards[0] });

        var objPlayers = Object.keys(players)
        var playersLength = objPlayers.length
        for(let i = 0; i<playersLength; i++){
            let playerName = objPlayers[i]
            let cards = players[playerName]
            io.emit("LoadPlayerCards", {"playerName": playerName, "cards": cards})
        }
    })

    socket.on("console", (data) => {
        console.log(data)
    })

    socket.on("disconnect", () => {

    })
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
    const { secret } = req.query;
    if (secret !== gamePassword) {
        return res.status(400).json({ message: 'Invalid game pass' });
    }
    res.json({"player": currentPlayersTurn});
})

app.get('/top-card',  (req, res) => {
    const { secret } = req.query;
    if (secret !== gamePassword) {
        return res.status(400).json({ message: 'Invalid game pass' });
    }
    res.json({"card": usedCards[0]});
})

app.get("/player-hand", (req, res) => {
    const { player } = req.body;
    let [error, canProceed] = CanRequestProceed(player, currentPlayersTurn);
    if (!canProceed){
        res.status(400).send(error)
        return;
    }
    res.json(players[player].sort());
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

app.post("/lay-card", (req, res) => {
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

server.listen(port, () => {
    console.log("Server running")
})
