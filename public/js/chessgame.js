const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const statusElement = document.getElementById("status");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chat-message");
const menuBtn = document.getElementById("menuBtn");
const menuOverlay = document.getElementById("menuOverlay");
const closeMenu = document.getElementById("closeMenu");
const drawBtn = document.getElementById("drawBtn");
const resignBtn = document.getElementById("resignBtn");
const restartBtn = document.getElementById("restartBtn");
const restartOverlay = document.getElementById("restartOverlay");
const restartYes = document.getElementById("restartYes");
const restartNo = document.getElementById("restartNo");
const drawOverlay = document.getElementById("drawOverlay");
const acceptDrawBtn = document.getElementById("acceptDrawBtn");
const declineDrawBtn = document.getElementById("declineDrawBtn");
const whiteTimeElement = document.getElementById("white-time");
const blackTimeElement = document.getElementById("black-time");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let legalMoves = [];
let highlightedSquares = [];
let waiting = true;
let gameOver = false;
let whiteTime = 10 * 60;
let blackTime = 10 * 60;
let timer = null;

menuBtn.addEventListener("click", () => {
  menuOverlay.classList.add("active");
});

closeMenu.addEventListener("click", () => {
  menuOverlay.classList.remove("active");
});

menuOverlay.addEventListener("click", (e) => {
  if(e.target === menuOverlay){
    menuOverlay.classList.remove("active");
  }
});

resignBtn.addEventListener("click", () => {
  socket.emit("resign");
});

restartBtn.addEventListener("click", () => {
  menuOverlay.classList.remove("active");
  statusElement.innerText = "Restart request sent ...";
  socket.emit("restartRequest");
});

restartYes.addEventListener("click", () =>{
  restartOverlay.classList.remove("active");
  socket.emit("restartResponse", {
    accepted : true,
  });
});

restartNo.addEventListener("click", () =>{
  restartOverlay.classList.remove("active");
  socket.emit("restartResponse", {
    accepted : false,
  });
});

drawBtn.addEventListener("click", () => {
  menuOverlay.classList.remove("active");
  statusElement.innerText = "Draw request sent...";
  socket.emit("drawRequest");
});

acceptDrawBtn.addEventListener("click", () => {
  drawOverlay.classList.remove("active");
  socket.emit("drawResponse", {
    accepted : true,
  });
});

declineDrawBtn.addEventListener("click", () => {
  drawOverlay.classList.remove("active");
  socket.emit("drawResponse", {
    accepted : false,
  });
});

// sendBtn.addEventListener("click", () => {
//   const message = input.value.trim();

//   if(message){
//     socket.emit("chatMessage",{
//       sender: playerRole,
//       text:message
//     });
//     input.value = "";
//   }
  
// });



function sendMessage() {
  const message = input.value.trim();

  if(!message) return;

  socket.emit("chatMessage",{
    sender : playerRole,
    text : message,
  });
  input.value = "";
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    sendMessage();
  }
});

// function updateClockDisplay() {
//   const whiteMin = Math.floor(whiteTime / 60);
//   const whiteSec = whiteTime % 60;

//   const blackMin = Math.floor(blackTime / 60);
//   const blackSec = blackTime % 60;

//   whiteTimeElement.textContent = `${String(whiteMin).padStart(2, "0")} : ${String(whiteSec).padStart(2, "0")}`;

//   blackTimeElement.textContent = `${String(blackMin).padStart(2, "0")} : ${String(blackSec).padStart(2, "0")}`;

// }

// function startClock() {
//   clearInterval(timer);

//   timer = setInterval(() => {
//     if(chess.turn() === "w"){
//       whiteTime--;

//       if(whiteTime <= 0){
//         whiteTime =0;
//         updateClockDisplay();
//         clearInterval(timer);

//         alert("White ran out of time!");
//         return;
//       }
//     }
//     else{
//       blackTime--;

//       if(blackTime <= 0){
//         blackTime =0;
//         updateClockDisplay();
//         clearInterval(timer);

//         alert("Black ran out of time!");
//         return;
//       }
//     }
//     updateClockDisplay();
//   }, 1000);
// }



const updateStatus = () => {
  if( gameOver ) return;
  let message = "";
  let statusClass = "";

  const isMyTurn = playerRole !== null && chess.turn() === playerRole;
  const activeColorName = chess.turn() === "w" ? "White" : "Black";
  const inactiveColorName = chess.turn() === "w" ? "Black" : "White";

  if (chess.in_checkmate()) {
    clearInterval(timer);
    if (playerRole !== null) {
      if (chess.turn() === playerRole) {
        message = "Checkmate! You Lose.";
        statusClass = "game-over-lose";
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

const showLegalMoves = (row, col) => {
  const square = `${String.fromCharCode(97 + col)}${8 - row}`;
  legalMoves = chess.moves({
    square: square,
    verbose: true,
  });
  renderBoard();
}

const clearHighlights = () => {
  highlightedSquares = [];
  legalMoves=[];
  renderBoard();
}

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

      const squareName = `${String.fromCharCode(97 + squareindex)}${8 - rowindex}`;
      const move = legalMoves.find(m => m.to === squareName);
      if(move){
        if(square){
          squareElement.classList.add("capture");
        }else{
          squareElement.classList.add("move");
        }
      }

      if(square){
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece",  square.color === "w" ? "white" : "black");

        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color && !gameOver;

        pieceElement.addEventListener("dragstart", (e) => {
          if(gameOver){
            e.preventDefault();
            return;
          }
          if(pieceElement.draggable){
            draggedPiece = pieceElement;
            sourceSquare = {row: rowindex, col: squareindex};

            setTimeout (() => {
              showLegalMoves(rowindex, squareindex);
            }, 0);
            
            e.dataTransfer.setData("text/plain", "");
          }
        });
        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;

          clearHighlights();

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
  if(waiting) return;
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

socket.on("waiting", () => {
  waiting = true,
  playerRole = null;
  chess.reset();
  // whiteTime = 10 * 60;
  // blackTime = 10 * 60;
  // updateClockDisplay();
  // clearInterval(timer);
  renderBoard();
  statusElement.innerText = "Waiting for player...";
});

socket.on("chatMessages", (data) => {
    const div = document.createElement("div");

    div.classList.add("message");

    if (data.sender === "w") {
        div.classList.add("white-message");
    } else {
        div.classList.add("black-message");
    }

    div.textContent = data.text;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("gameResigned", ({ winner }) => {
  clearInterval(timer);
  gameOver = true;
  waiting = true;

  draggedPiece = null;
  sourceSquare = null;
  legalMoves = [];

  renderBoard();
  menuOverlay.classList.remove("active");

  if((winner === "white" && playerRole === "w") || (winner === "black" && playerRole === "b")){
    statusElement.innerText = "You Win! Opponent Resigned."
    statusElement.className = "status-bar game-over-victory";
  }else{
    statusElement.innerText = "You Lose! You Resigned."
    statusElement.className = "status-bar game-over-defeat";
  }
});

 //Recieve Restart Request

socket.on("restartRequest", () => {
  restartOverlay.classList.add("active");
  // socket.emit("restartResponse", {
  //   accepted : accept,
  // });
});

// Restart Declined

socket.on("restartDeclined", () => {
  statusElement.innerText = "Restart request declined.";
});

// Game Restarted

socket.on("gameRestarted", () => {
  gameOver = false;
  waiting = false;

  // whiteTime = 10 * 60;
  // blackTime = 10 * 60;

  updateClockDisplay();
  startClock();

  draggedPiece = null;
  sourceSquare = null;
  legalMoves = [];

  menuOverlay.classList.remove("active");

  renderBoard();
});

socket.on("drawRequest", () => {
  drawOverlay.classList.add("active");
});

socket.on("drawDeclined", () => {
  statusElement.innerText = "Draw request declined.";
});

socket.on("gameDrawn", () => {
  clearInterval(timer);
  gameOver = true;
  waiting = true;

  draggedPiece = null;
  sourceSquare = null;
  legalMoves = [];

  menuOverlay.classList.remove("active");
  drawOverlay.classList.remove("active");

  statusElement.innerText = "Game Drawn by Agreement.";
  statusElement.className = "status-bar game-over-draw";

  renderBoard();
});

socket.on("playerRole", function(role) {
  waiting = false;
  playerRole = role;
  renderBoard();
});

socket.on("playerDisconnected", () => {
  waiting = true;
  statusElement.innerText = "Opponent disconnected";
});

socket.on("clearChat", () => {
  document.getElementById("chat-message").innerHTML = "";
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  // gameStatus = "";
  renderBoard();
});

socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
  startClock();
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
// updateClockDisplay();
// startClock();