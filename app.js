//git clone https://github.com/andasan/m1-0120-nodejs-205-auth
//git remote -v //to check the origin's url
//git remote remove origin
//git remote add origin <your_url>
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

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

const MIME_TYPE_MAP = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif"
};

//-------Middlewares

//setting up view engine (when we are not using REACT as our view)
app.set("view engine", "ejs");
//specify views folders name
app.set("views", "views");

//parse the request body into readable data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({
    limits: 3000000, //bytes
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "uploads/images");
      },
      filename: (req, file, cb) => {
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, uuidv4() + "." + ext); //ewrtwert3423rwet.jpg
      }
    }),
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype]; //if we get undefined or null, !! converts it to false
      let error = isValid ? null : new Error("Invalid MIME type");
      cb(error, isValid);
    }
  }).single("image")
);
//specify the public folder to be of static access
// app.use(express.static(path.join(__dirname,'public')));
app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "uploads", "images"))
);
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
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAuth = req.session.isLoggedIn;
  next();
});

app.use((req, res, next) => {
  // throw new Error('dummy error');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoute); //set the routes for admin
app.use(shopRoute); //set the routes for shop
app.use(authRoute); //set the routes for auth
app.get("/500", errorController.get500);

//error checking middleware
app.use(errorController.get404);

//error handler middleware
app.use((error, req, res, next) => {
  // res.redirect('/500');
  // const code = error.httpStatusCode
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuth: req.session.isLoggedIn
  });
});

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
