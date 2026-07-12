const express = require("express");
const http = require("http");
const socket = require("socket.io");
const path = require("path");

const { connectToMongoDB } = require("./connect")
const socketController = require("./controllers/socketController");
const indexRoutes = require("./routes");
const authRoutes = require("./routes/authRoutes");

const app = express();

const server = http.createServer(app);
const io = socket(server);

connectToMongoDB("mongodb://localhost:27017/chess")
  .then(() => console.log("Mongodb Connected"));


app.use(express.urlencoded({extended: true}));


app.use("/", authRoutes);


// View Engine
app.set("view engine", "ejs");

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRoutes);

// Socket.IO
socketController(io);

// Server
server.listen(8002, () => {
  console.log("Listening on port 8002");
});