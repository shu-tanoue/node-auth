require("dotenv").config();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

exports.getLogin = (req, res, next) => {
  let errMsg = req.flash("error");
  if (errMsg.length > 0) {
    errMsg = errMsg[0];
  } else {
    errMsg = null;
  }
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: errMsg
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash("error", "Invalid Email or Password");
        return res.redirect("/login");
      }

      bcrypt
        .compare(password, user.password)
        .then(isMatching => {
          if (isMatching) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect("/");
            });
          }

          //if password do not match
          req.flash("error", "Invalid Email or Password");
          res.redirect("/login");
        })
        .catch(err => {
          console.log(err);
          req.flash("error", "Invalid Email or Password");
          res.redirect("/login");
        });
    })
    .catch(err => console.log(err));
};

exports.getSignUp = (req, res, next) => {
  let errMsg = req.flash("error");
  if (errMsg.length > 0) {
    errMsg = errMsg[0];
  } else {
    errMsg = null;
  }
  res.render("auth/signup", {
    pageTitle: "Sign Up",
    path: "/signup",
    errorMessage: errMsg
  });
};

exports.postSignUp = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    return res.status(422).render("auth/signup", {
      pageTitle: "Sign Up",
      path: "/signup",
      errorMessage: errors.array()[0].msg
    });
  }

  bcrypt
    .hash(password, 12) //12 rounds of hashing - considered to be highly secured
    .then(hashedPassword => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      //temporarily disable sending of mail..... for now :)
      // return transporter.sendMail({
      //     to: email,
      //     from: 'andasan@gmail.com',
      //     subject: 'Sign up succeeded!',
      //     html: '<h1>You have successfully signed up!</h1>'
      // });
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};
