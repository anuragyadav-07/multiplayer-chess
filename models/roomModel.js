const { Chess } = require("chess.js");

const waitingPlayers = [];
const rooms = {};

function createRoom(player1, player2, io) {
  const roomId =
    "room-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

  player1.join(roomId);
  player2.join(roomId);

  rooms[roomId] = {
    chess: new Chess(),
    white: player1.id,
    black: player2.id,

    whiteTime : 10 * 60,
    blackTime : 10 * 60,
    timer : null,
  };

  player1.roomId = roomId;
  player2.roomId = roomId;

  player1.emit("playerRole", "w");
  player2.emit("playerRole", "b");

  io.to(roomId).emit("boardState", rooms[roomId].chess.fen());

  console.log("Created:", roomId);

  return roomId;
}

module.exports = {
  waitingPlayers,
  rooms,
  createRoom,
};