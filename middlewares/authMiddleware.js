const jwt = require("jsonwebtoken");
const { showLogin } = require("../controllers/authController");

function authenticate(req, res, next) {
  const token = req.cookies.token;

  if(!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  }
  catch(err) {
    return res.redirect("/login");
  }
}

module.exports = authenticate;