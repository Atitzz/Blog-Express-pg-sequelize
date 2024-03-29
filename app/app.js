const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

const connectDB = require("./config/connect");
const router = require("./routes");
const configViewEngine = require("./config/viewEngine");
const descriptionText = require("./controller/function/localFunction");

const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(require("connect-flash")());

app.locals.descriptionText = descriptionText;

configViewEngine(app);
router(app);
connectDB();

module.exports = app;
