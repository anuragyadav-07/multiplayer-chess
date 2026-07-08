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

module.exports = {
  handleMove,
};