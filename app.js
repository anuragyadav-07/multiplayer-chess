const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const waitingPlayers = [];
const rooms = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", {title: "Chess Game"});
});


function createRoom(player1, player2) {
  const roomId = "room-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

  player1.join(roomId);
  player2.join(roomId);

  rooms[roomId] = {
    chess: new Chess(),
    white: player1.id,
    black: player2.id,
  };

  player1.roomId = roomId;
  player2.roomId = roomId;

  player1.emit("playerRole", "w");
  player2.emit("playerRole", "b");

  io.to(roomId).emit("boardState", rooms[roomId].chess.fen());

  console.log("Created:", roomId);

  return roomId;
  
}

io.on("connection", (socket) => {
  console.log(socket.id + "connected");

  if(waitingPlayers.length === 0){
    waitingPlayers.push(socket);
    socket.emit("waiting");
  }else{
    const opponent = waitingPlayers.shift();

    createRoom(opponent, socket);
  }

  //chat
  
    socket.on("chatMessage", (data) => {
    if(!socket.roomId) return;
    io.to(socket.roomId).emit("chatMessages", data);
  });

  // Move

  socket.on("move", (move) => {
    if(!socket.roomId) return;

    const room = rooms[socket.roomId];

    if(!room) return;

    const chess = room.chess;
    // Only the correct player can move
    if(chess.turn() === "w" && socket.id !== room.white) return;
    if(chess.turn() === "b" && socket.id !== room.black) return;

    try {
      const result = chess.move(move);
      if(!result) {
        socket.emit("invalidMove", move);
        return;
      }
      // Send updated board only to this room
      io.to(socket.roomId).emit("move", move);

      io.to(socket.roomId).emit("boardState", chess.fen());

      if(chess.isCheck()){
        io.to(socket.roomId).emit("check");
      }

      if(chess.isCheckmate()){
        io.to(socket.roomId).emit("checkmate");
      }

      if(chess.isStalemate()){
        io.to(socket.roomId).emit("stalemate");
      }

      if(chess.isDraw()){
        io.to(socket.roomId).emit("draw");
      }
    }
    catch(err) {
      console.log(err);
      socket.emit("invalidMove", move);
    }
  });

  // Disconnected

  socket.on("disconnect", () => {

    console.log(socket.id + " disconnected");

    // Remove from waiting queue if the player was waiting
    const waitingIndex = waitingPlayers.findIndex(
        player => player.id === socket.id
    );

    if (waitingIndex !== -1) {
        waitingPlayers.splice(waitingIndex, 1);
        return;
    }

    //If the player was in a room

    const roomId = socket.roomId;

    if (!roomId || !rooms[roomId]) return;

    const room = rooms[roomId];

    let opponentSocket = null;

    if (socket.id === room.white) {
        opponentSocket = io.sockets.sockets.get(room.black);
    } else if (socket.id === room.black) {
        opponentSocket = io.sockets.sockets.get(room.white);
    }

    delete rooms[roomId];

    if (opponentSocket) {

        opponentSocket.roomId = null;

        opponentSocket.emit("playerDisconnected");

        opponentSocket.emit("waiting");

        waitingPlayers.push(opponentSocket);

    }

  });

});

server.listen(8002, function () {
  console.log("Listening on port 8002");
});