const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function signup(username, email, password) {
  // Check if user already exists

  const existingUser = await User.findOne({
    $or : [{ username },
      {email}],
  });
  if(existingUser){
    // throw new Error("User already exists");
    if(existingUser.username === username) {
      throw{
        field: "username",
        message: "Username already exists",
      };
    }

    if(existingUser.email === email) {
      throw{
        field: "email",
        message: "Email already exists",
      };
    }
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

async function login(username, password){
  const user = await User.findOne({username});
  
  if(!user){
    // throw new Error("User not found");
    throw {
      field: "username",
      message: "Username not found",
    };
  }
  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch){
    // throw new Error("Invalid Password");
    throw {
      field: "password",
      message: "Invalid password",
    };
  }

  const token = jwt.sign(
    {  // Payload => The payload contains information that you want to store inside the JWT.
      id: user._id,        // It stores the user's database ID inside the token.
      username: user.username,    // Stores the username inside the token.
    },
    process.env.JWT_SECRET,
    {
      expiresIn:"1d",
    }
  );
  return {user, token};
}

module.exports = {
  signup,
  login,
}