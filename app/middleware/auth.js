const jwt = require('jsonwebtoken');

require('dotenv').config();
const config = process.env;

const auth = (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.redirect('/users/login');
        }
        const decoded = jwt.verify(token, config.TOKEN);
        req.user = decoded.user;

        next();
    } catch (error) {
        console.log(error);
        return res.send('Invalid token');
    }
}

module.exports = auth

