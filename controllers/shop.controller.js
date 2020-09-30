require("dotenv").config();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const Order = require("../models/order.model");
const Product = require("../models/product.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    .catch(err => {
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

//getting one product
exports.getOneProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(result => {
      res.render("shops/product-detail", {
        pageTitle: result.title,
        product: result,
        path: "/products" //for navigation bar's active button
      });
    })
    .catch(err => {
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
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
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      console.log("Added To Cart");
      res.redirect("/cart");
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch(err => {
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
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
    .catch(err => {
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
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
    .catch(err => {
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckOut = (req, res, next) => {
  let products;
  let total = 0;
  let stripePubKey = process.env.STRIPE_PUB_KEY;

  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map(p => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: "usd",
            quantity: p.quantity
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel"
      });
    })
    .then(session => {
      return res.render("shops/checkout", {
        pageTitle: "Checkout",
        path: "/checkout",
        products: products,
        totalSum: total,
        stripePubKey: stripePubKey,
        sessionId: session.id
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(item => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user
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
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  // console.log('getinvoice');
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error("No order found."));
      }

      if (order.user.userId.toString() !== req.user._id.toString()) {
        // return next(new Error('Unauthorized'))
        const error = new Error(err);
        error.httpStatusCode = 401;
        return next(error);
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename=" ' + invoiceName + ' " '
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true
      });
      pdfDoc.text("-----------------------------");
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc.text("-----------------------------");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

      pdfDoc.end();
    })
    .catch(err => next(err));
};
