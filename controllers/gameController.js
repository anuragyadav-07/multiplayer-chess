const { Chess } = require("chess.js");
const { rooms } = require("../models/roomModel");

function handleMove(io, socket, move) {
  if (!socket.roomId) return;

  const room = rooms[socket.roomId];

  if (!room) return;

  const chess = room.chess;

  // Only the correct player can move
  if (chess.turn() === "w" && socket.id !== room.white) return;
  if (chess.turn() === "b" && socket.id !== room.black) return;

  try {
    const result = chess.move(move);

    if (!result) {
      socket.emit("invalidMove", move);
      return;
    }

    // Send move to both players
    io.to(socket.roomId).emit("move", move);

    // Send updated board
    io.to(socket.roomId).emit("boardState", chess.fen());

    if (chess.isCheck()) {
      io.to(socket.roomId).emit("check");
    }

    if (chess.isCheckmate()) {
      io.to(socket.roomId).emit("checkmate");
    }

    if (chess.isStalemate()) {
      io.to(socket.roomId).emit("stalemate");
    }

    if (chess.isDraw()) {
      io.to(socket.roomId).emit("draw");
    }
  } catch (err) {
    console.log(err);
    socket.emit("invalidMove", move);
  }
}

function handleResign(io, socket, rooms) {
  
  const roomId = socket.roomId;

  if(!roomId || !rooms[roomId]) return;

  const room = rooms[roomId];

  const winner = socket.id === room.white ? "black" : "white";

  io.to(socket.roomId).emit("gameResigned", {
    winner,
  });
}

function handleRestartRequest(io, socket, rooms) {
  const room = rooms[socket.roomId];
  if(!room) return;

  const opponentId = socket.id === room.white ? room.black : room.white;
  io.to(opponentId).emit("restartRequest");
}

function handleRestartResponse(io, socket, rooms, accepted) {
  
  const roomId = socket.roomId;
  if(!roomId || !rooms[roomId]) return;

  if(!accepted) {
    const room = rooms[roomId];
    const requesterId = socket.id === room.white ? room.black : room.white;
    io.to(requesterId).emit("restartDeclined");
    return;
  }

  rooms[roomId].chess = new Chess();

  io.to(roomId).emit("boardState", rooms[roomId].chess.fen());

  io.to(roomId).emit("gameRestarted");
}

function handleDrawRequest(io, socket, rooms) {
  const room = rooms[socket.roomId];
  if(!room) return;

  const opponentId = socket.id === room.white ? room.black : room.white;
  io.to(opponentId).emit("drawRequest");
}

function handleDrawResponse(io, socket, rooms, accepted) {
  
  const roomId = socket.roomId;
  if(!roomId || !rooms[roomId]) return;

  const room = rooms[roomId];

  if(!accepted) {
    const requesterId = socket.id === room.white ? room.black : room.white;
    io.to(requesterId).emit("drawDeclined");
    return;
  }
  //Draw Accepted
  io.to(roomId).emit("gameDrawn");
}

module.exports = {
  handleMove,
  handleResign,
  handleRestartRequest,
  handleRestartResponse,
  handleDrawRequest,
  handleDrawResponse,
};