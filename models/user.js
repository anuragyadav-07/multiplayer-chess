const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username : {
    type : String,
    required : true,
    unique : true,
    trim : true,
  },
  email: {
    type : String,
    required : true,
    unique : true,
    lowercase : true,
  },
  password: {
    type : String,
    required : true,
  },
  ranking: {
    type: Number,
    default: 0,
  },
  matches: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  draws: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
    default: "👤",
  },
},{ 
  timestamps : true
});

module.exports = mongoose.model("User", userSchema);