const User = require("../models/user");
const authService = require("../services/authService");

// Show Signup Page
function showSignup (req, res) {
  res.render("signup", {
    // error: null,
    username: "",
    email: "",
    usernameError: null,
    emailError: null,
  });
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
    // res.status(400).send(error.message);
    res.status(400).render("signup", {
      // error: error.message,
      username: req.body.username,
      email: req.body.email,
      usernameError: error.field === "username" ? error.message : null,
      emailError: error.field === "email" ? error.message : null,
    });
  }
};

// Show Login Page
function showLogin (req, res) {
  res.render("login", {
    // error: null,
    username: "",
    usernameError: null,
    passwordError: null,
  });
};

// Handle login
async function handleUserLogin(req, res) {
  try {
    const { username, password } = req.body;

    const {user, token} = await authService.login(username, password);

// res.cookie() is an Express.js method used to create and send a cookie to the client's browser.
    res.cookie("token", token, {   // syntax : res.cookie(name, value, options)
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,  // 1 day
    });

    // if(!user) {
    //   return res.send("User not found");
    // }

    res.redirect("/dashboard");
  }
  catch(error) {
    // res.status(400).send(err.message);
    res.status(400).render("login", {
      // error: err.messge,
      username: req.body.username,
      usernameError: error.field === "username" ? error.message : null,
      passwordError: error.field === "password" ? error.message : null,
    });
  }
}

// Logout
function handleLogout(req, res) {
  res.clearCookie("token");
  res.redirect("/login");
}

module.exports = {
  showSignup,
  handleUserSignup,
  showLogin,
  handleUserLogin,
  handleLogout,
}