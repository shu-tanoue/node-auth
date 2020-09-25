const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shop.controller");
const isAuth = require("../middleware/isAuth");

// @route   GET /
// @desc    Get all products
// @access  Public
router.get("/", shopController.getProducts);

// @route   GET /products
// @desc    Get a certain product by id
// @access  Public
router.get("/products/:productId", shopController.getOneProduct);

// @route   GET /cart
// @desc    Get products added in cart by a user
// @access  Private
router.get("/cart", isAuth, shopController.getCart);

// @route   POST /cart
// @desc    For users to add a product in a cart
// @access  Private
router.post("/cart", isAuth, shopController.postCart);

// @route   POST /cart
// @desc    Removes a product from the cart
// @access  Private
router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

// @route   POST /orders
// @desc    Consolidate all products in cart to orders collection
// @access  Private
router.get("/orders", isAuth, shopController.getOrders);

// @route   GET /orders
// @desc    Get all products in orders collection by user id
// @access  Private
router.post("/create-order", isAuth, shopController.postOrder);

// router.get('/checkout', shopController.getCheckOut);

module.exports = router;
