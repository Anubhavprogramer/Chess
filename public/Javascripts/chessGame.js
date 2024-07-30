const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const currentTurnElement = document.getElementById("current-turn");
const alertElement = document.getElementById("alert");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const RenderBoard = () => {
  const Board = chess.board();
  boardElement.innerHTML = "";
  Board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.draggable = false;
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowindex;
      squareElement.dataset.column = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerHTML = getUniCode(square);
        pieceElement.draggable = (playerRole && playerRole.toLowerCase() === square.color);

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, column: squareindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            column: parseInt(squareElement.dataset.column),
          };
          HandleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if(playerRole == 'B'){
    boardElement.classList.add('flipped');
  }
  else{
    boardElement.classList.remove('flipped');
  }
};

const HandleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.column)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.column)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move);
};

const getUniCode = (piece) => {
  const UniCodes = {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
  };
  return piece.color === 'w' ? UniCodes[piece.type.toUpperCase()] : UniCodes[piece.type.toLowerCase()];
};

socket.on("playerRole", (role) => {
  playerRole = role;
  RenderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  RenderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  RenderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  RenderBoard();
});

socket.on("illegalMove", (message) => {
  alertElement.innerText = message;
  setTimeout(() => {
    alertElement.innerText = '';
  }, 3000);
});

socket.on("currentPlayer", (turn) => {
  currentTurnElement.innerText = `Current Turn: ${turn === 'w' ? 'White' : 'Black'}`;
});

RenderBoard();
