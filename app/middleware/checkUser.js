// เอาไว้เช็คการเข้าถึงในหน้าต่างๆ เช่น หน้า register, login
const checkAccessToPage = (req, res, next) => {
    try {
        if (req.cookies && req.cookies.jwt) {
            return res.redirect('/');
        } 

        next();
    } catch (error) {
        console.log(error);
    }
};

module.exports = checkAccessToPage;