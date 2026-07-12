const User = require("../models/user");
const authService = require("../services/authService");

// Show Signup Page
function showSignup (req, res) {
  res.render("signup");
};

// Handle Signup
async function handleUserSignup (req, res) {
  try{
    const { username, email, password } = req.body;
    await authService.signup(username, email, password);

    //Redirect to login page after successfull signup
    res.redirect("/login");
  }
  catch (error) {
    res.status(400).send(error.message);
  }
};

// Show Login Page
function showLogin (req, res) {
  res.render("login");
};

// Handle login
async function handleUserLogin(req, res) {
  try {
    const { username } = req.body;

    const user = await authService.login(username);

    if(!user) {
      return res.send("User not found");
    }

    res.redirect("/");
  }
  catch(err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
}

module.exports = {
  showSignup,
  handleUserSignup,
  showLogin,
  handleUserLogin,
}