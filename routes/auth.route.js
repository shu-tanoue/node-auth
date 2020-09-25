const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// @route   GET /login
// @desc    Login page
// @access  Public
router.get('/login', authController.getLogin);

// @route   POST /login
// @desc    Authenticate a user
// @access  Public
router.post('/login', authController.postLogin);

// @route   GET /signup
// @desc    To see the User registration page
// @access  Public
router.get('/signup', authController.getSignUp);

// @route   POST /signup
// @desc    To submit or create a new user
// @access  Public
router.post('/signup', authController.postSignUp);

// @route   POST /logout
// @desc    Un-authenticate a user
// @access  Public
router.post('/logout', authController.postLogout);

module.exports = router;