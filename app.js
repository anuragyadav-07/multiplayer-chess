const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", {title: "Chess Game"});
});

io.on("connection", function(uniquesocket){
  console.log("connected");

  if(!players.white){
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  }
  else if(!players.black){
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  }
  else{
    uniquesocket.emit("spectatorRole");
  }

  // Send current board state immediately on connection
  uniquesocket.emit("boardState", chess.fen());

uniquesocket.on("disconnect", function(){
  if(uniquesocket.id === players.white){
    delete players.white;
  }

  else if(uniquesocket.id === players.black){
    delete players.black;
  }
});

uniquesocket.on("move", (move) => {
  try{
    // Prevent moves if the game is already over
    if (chess.isGameOver()) {
      return;
    }

    if(chess.turn() ==="w" && uniquesocket.id !== players.white) return;

    if(chess.turn() ==="b" && uniquesocket.id !== players.black) return;

    const result = chess.move(move);
    
    if(result){
      if(chess.isCheckmate()){
        io.emit("checkmate", {
          winner: result.color,
        });
      }
      else if(chess.isStalemate()){
        io.emit("stalemate");
      }
      else if(chess.isDraw()){
        io.emit("draw", {
          reason: chess.isThreefoldRepetition() ? "threefold repetition" :
                  chess.isInsufficientMaterial() ? "insufficient material" : "draw"
        });
      }
      else if(chess.isCheck()){
        io.emit("check", { 
          checkedPlayer: chess.turn()
        });
      }

      io.emit("move", move);
      io.emit("boardState", chess.fen());
    }

    else{
      console.log("Invalid Move : ", move);
      uniquesocket.emit("invalidMove", move);
    }
  }
  catch(err){
    console.log(err);
    uniquesocket.emit("invalidMove", move);
  }
});

});

server.listen(8002, function () {
  console.log("Listening on port 80002");
});