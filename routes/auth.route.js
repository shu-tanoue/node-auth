const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { body } = require("express-validator");

const User = require("../models/user.model");

// @route   GET /login
// @desc    Login page
// @access  Public
router.get("/login", authController.getLogin);

// @route   POST /login
// @desc    Authenticate a user
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body("password", "Password has to be valid")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

// @route   GET /signup
// @desc    To see the User registration page
// @access  Public
router.get("/signup", authController.getSignUp);

// @route   POST /signup
// @desc    To submit or create a new user
// @access  Public
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              "Email already exists. Please use a different email."
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and text with at least 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      })
      .trim()
  ],
  authController.postSignUp
);

// @route   POST /logout
// @desc    Un-authenticate a user
// @access  Public
router.post("/logout", authController.postLogout);

module.exports = router;
