const express = require("express");
const authenticate = require("../middlewares/authMiddleware");

const router  = express.Router();

router.get("/dashboard", authenticate, (req, res) => {
  res.render("dashboard", {
    title: "dashboard",
    user: req.user,
  });
});

module.exports = router;