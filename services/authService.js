const User = require("../models/user");
const bcrypt = require("bcrypt");

async function signup(username, email, password) {
  // Check if user already exists

  const existingUser = await User.findOne({
    $or : [{ username },
      {email}],
  });
  if(existingUser){
    throw new Error("User already exists");
  }

  //Hash Password

  const hashedPassword = await bcrypt.hash(password, 10);

  //save user
  const user = new User({
    username,
    email,
    password : hashedPassword,
  });

  await user.save();
}

async function login(username){
  const user = await User.findOne({username});
  return user;
}

module.exports = {
  signup,
  login,
}