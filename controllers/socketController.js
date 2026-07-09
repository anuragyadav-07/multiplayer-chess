const { waitingPlayers, rooms, createRoom } = require("../models/roomModel");

const { 
  handleMove,
  handleResign,
  handleRestartRequest,
  handleRestartResponse,
  handleDrawRequest,
  handleDrawResponse,
} = require("./gameController");

function socketController(io) {
  io.on("connection", (socket) => {
    console.log(socket.id + " connected");

    // Matchmaking
    if (waitingPlayers.length === 0) {
      waitingPlayers.push(socket);
      socket.emit("waiting");
    } else {
      const opponent = waitingPlayers.shift();
      createRoom(opponent, socket, io);
    }

    // Chat
    socket.on("chatMessage", (data) => {
      if (!socket.roomId) return;
      io.to(socket.roomId).emit("chatMessages", data);
    });

    // Move
    socket.on("move", (move) => {
      handleMove(io, socket, move);
    });

    socket.on("resign", () => {
      handleResign(io, socket, rooms);
    });

    socket.on("restartRequest", () => {
      handleRestartRequest(io, socket, rooms);
    });

    socket.on("restartResponse", ({ accepted }) => {
      handleRestartResponse(io, socket, rooms, accepted);
    });

    socket.on("drawRequest", () => {
      handleDrawRequest(io, socket, rooms);
    });

    socket.on("drawResponse", ({ accepted }) => {
      handleDrawResponse(io, socket, rooms, accepted);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(socket.id + " disconnected");

      // Remove from waiting queue if the player is waiting
      const waitingIndex = waitingPlayers.findIndex(
        (player) => player.id === socket.id
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
      //clear the chat 
      io.to(roomId).emit("clearChat");

      delete rooms[roomId];

      if (opponentSocket) {
        opponentSocket.roomId = null;

        opponentSocket.emit("playerDisconnected");
        opponentSocket.emit("waiting");

        waitingPlayers.push(opponentSocket);
      }
    });
  });
}

module.exports = socketController;