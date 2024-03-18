const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

const connectDB = require("./app/config/connect");
const router = require("./app/routes");
const configViewEngine = require("./app/config/viewEngine");
const descriptionText = require("./app/controller/function/localFunction");

require('dotenv').config()
const config = process.env

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

app.listen(config.PORT, () => {
  console.log(`Connected to Server on port ${config.PORT}`);
})

module.exports = app;
