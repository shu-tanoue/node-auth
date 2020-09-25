const Order = require("../models/order.model");
const Product = require("../models/product.model");

//getting all products
exports.getProducts = (req, res, next) => {
  //fetchAll
  Product.find()
    .then(products => {
      res.render("shops/product-list", {
        pageTitle: "All Products",
        products: products,
        path: "/" //for navigation bar's active button
      });
    })
    .catch(err => console.log(err));
};

//getting one product
exports.getOneProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(result => {
      console.log(result);
      res.render("shops/product-detail", {
        pageTitle: result.title,
        product: result,
        path: "/products" //for navigation bar's active button
      });
    })
    .catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate() //to enable our populate() to return a promise
    .then(user => {
      const products = user.cart.items;
      res.render("shops/cart", {
        pageTitle: "Your cart",
        products: products,
        path: "/cart"
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect("/cart");
    })
    .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(item => {
        return {
          product: { ...item.productId._doc }, //doc pulls out all the data with that id
          quantity: item.quantity
        };
      });
      const order = new Order({
        products: products,
        user: {
          name: req.user.name,
          userId: req.user //mongoose will only pull out the _id
        }
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then(orders => {
      res.render("shops/orders", {
        pageTitle: "Your Orders",
        path: "/orders",
        orders: orders
      });
    })
    .catch(err => console.log(err));
};

// exports.getCheckOut = (req, res, next) => {
//     res.render('shops/checkout', {
//         pageTitle: 'Checkout',
//         path: '/checkout'
//     })
// }
