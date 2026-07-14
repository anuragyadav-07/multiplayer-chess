const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Show Signup Page
router.get("/signup", 
  authController.showSignup
);

// Handle Signup 
router.post("/signup", 
  authController.handleUserSignup
);

// show Login Page
router.get("/login",
  authController.showLogin
);

// Handle Login
router.post("/login",
  authController.handleUserLogin
);

// LogOut
router.get("/logout",
  authController.handleLogout
);

module.exports = router;