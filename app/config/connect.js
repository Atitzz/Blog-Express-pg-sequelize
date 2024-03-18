const { Sequelize } = require("sequelize");
const db = require('../models/index');

require("dotenv").config();
const config = process.env;

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: 'postgres',
    logging: console.log,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to Database');
        await db.sequelize.sync({ alter: true });
        console.log("Database Sync Success")
    } catch (error) {
        console.log("Error connecting", error.message);
    }
}

module.exports = connectDB;
