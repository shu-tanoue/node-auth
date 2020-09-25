//git clone https://github.com/andasan/m1-0120-nodejs-205-auth
//git remote -v //to check the origin's url
//git remote remove origin
//git remote add origin <your_url>

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// const path = require('path');
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const app = express();
const store = new MongoDBStore({
  uri: process.env.MONGODB_URL,
  collection: "sessions"
});
const csrfProtection = csrf();

const shopRoute = require("./routes/shop.route");
const adminRoute = require("./routes/admin.route");
const authRoute = require("./routes/auth.route");
const errorController = require("./controllers/error.controller");

const User = require("./models/user.model");

//-------Middlewares

//setting up view engine (when we are not using REACT as our view)
app.set("view engine", "ejs");
//specify views folders name
app.set("views", "views");

//parse the request body into readable data
app.use(bodyParser.urlencoded({ extended: false }));
//specify the public folder to be of static access
// app.use(express.static(path.join(__dirname,'public')));
app.use("/public", express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAuth = req.session.isLoggedIn;
  next();
});

app.use("/admin", adminRoute); //set the routes for admin
app.use(shopRoute); //set the routes for shop
app.use(authRoute); //set the routes for auth

//error 404 checking middleware
app.use(errorController.get404);

//-------end of Middlewares

//set up the port
const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to Database!");
    app.listen(PORT, () => console.log(`Server started at port ${PORT}.`));
  })
  .catch(err => console.log(err));
