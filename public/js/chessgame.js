const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const statusElement = document.getElementById("status")

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
const updateStatus = () => {
  let message = "";
  let statusClass = "";

  const isMyTurn = playerRole !== null && chess.turn() === playerRole;
  const activeColorName = chess.turn() === "w" ? "White" : "Black";
  const inactiveColorName = chess.turn() === "w" ? "Black" : "White";

  if (chess.in_checkmate()) {
    if (playerRole !== null) {
      if (chess.turn() === playerRole) {
        message = "Checkmate! You Lose.";
        statusClass = "game-over-draw";
      } else {
        message = "Checkmate! You Win!";
        statusClass = "game-over-victory";
      }
    } else {
      message = `Checkmate! ${inactiveColorName} Wins!`;
      statusClass = "game-over-victory";
    }
  } else if (chess.in_stalemate()) {
    message = "Game Over: Stalemate!";
    statusClass = "game-over-draw";
  } else if (chess.insufficient_material()) {
    message = "Game Over: Draw (Insufficient Material)";
    statusClass = "game-over-draw";
  } else if (chess.in_threefold_repetition()) {
    message = "Game Over: Draw (Threefold Repetition)";
    statusClass = "game-over-draw";
  } else if (chess.in_draw()) {
    message = "Game Over: Draw!";
    statusClass = "game-over-draw";
  } else if (chess.in_check()) {
    if (playerRole !== null) {
      if (isMyTurn) {
        message = "Check! Your King is in check.";
      } else {
        message = "Check! Opponent's King is in check.";
      }
    } else {
      message = `Check! ${activeColorName}'s Turn`;
    }
    statusClass = "check";
  } else {
    if (playerRole !== null) {
      message = isMyTurn ? "Your Turn" : "Opponent's Turn";
    } else {
      message = `${activeColorName}'s Turn`;
    }
    statusClass = chess.turn() === "w" ? "white-turn" : "black-turn";
  }

  statusElement.className = "status-bar " + statusClass;
  statusElement.innerText = message;
};

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      if(square){
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece",  square.color === "w" ? "white" : "black");

        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if(pieceElement.draggable){
            draggedPiece = pieceElement;
            sourceSquare = {row: rowindex, col: squareindex};
            e.dataTransfer.setData("text/plain", "");
          }
        });
        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if(draggedPiece){
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if(playerRole === "b"){
    boardElement.classList.add("flipped");
  }else{
    boardElement.classList.remove("flipped");
  }

  updateStatus();
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q"
  };

  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♚",
  };

  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function(role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  gameStatus = "";
  renderBoard();
});

socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});

socket.on("check", (data) => {
  // Handled automatically via boardState and renderBoard updateStatus()
});

socket.on("checkmate" , (data) => {
  // Handled automatically via boardState and renderBoard updateStatus()
});

socket.on("stalemate", () => {
  // Handled automatically via boardState and renderBoard updateStatus()
});

socket.on("draw", () => {
  // Handled automatically via boardState and renderBoard updateStatus()
});


renderBoard();