const jwt = require("jsonwebtoken");
const { showLogin } = require("../controllers/authController");
const User = require("../models/user");
// const user = require("../models/user");

async function authenticate(req, res, next) {
  const token = req.cookies.token;

  if(!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    // req.user = user;

    next();
  }
  catch(err) {
    return res.redirect("/login");
  }
}

module.exports = authenticate;