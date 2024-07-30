const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = 'W';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on('connection', (uniquesocket) => {
    console.log('A user connected ');

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'W');
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'B');
    } else {
        uniquesocket.emit('spectatorRole');
    }

    uniquesocket.on('disconnect', () => {
        if (uniquesocket.id == players.white) {
            delete players.white;
            console.log('White player disconnected');
        } else if (uniquesocket.id == players.black) {
            delete players.black;
            console.log('Black player disconnected');
        }
    });

    uniquesocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
                io.emit('currentPlayer', currentPlayer);
            } else {
                console.log('Illegal move');
                uniquesocket.emit('illegalMove', 'Illegal move');
            }
        } catch (err) {
            uniquesocket.emit('illegalMove', err.message);
            console.log(err);
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
