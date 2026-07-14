const express = require("express");
const authenticate = require("../middlewares/authMiddleware");

const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", (req, res) => {
  const token = req.cookies.token;

  if(!token) {
    return res.redirect("/login");
  }

  try{
    jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect("/game");
  }
  catch(err) {
    return res.redirect("/login");
  }
});

router.get("/game", authenticate, (req, res) => {
  res.render("index", {
    title: "Chess Game",
  });
});

module.exports = router;