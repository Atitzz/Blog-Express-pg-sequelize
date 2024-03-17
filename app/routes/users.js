const express = require('express');
const router = express.Router();

const controllerUser = require('../controller/user')
const auth = require('../middleware/auth');
const checkAccessToPage = require('../middleware/checkUser');
const { uploadImageProfile } = require('../middleware/upload');


router.get('/', auth, checkAccessToPage, function (req, res, next) {
  res.send('hellooooo');
});

router.get('/register', checkAccessToPage, controllerUser.formRegister);
router.get('/login', checkAccessToPage, controllerUser.formLogin);
router.get('/registerSuccess', checkAccessToPage , controllerUser.registerSuccess)
router.post('/register', checkAccessToPage, controllerUser.register);
router.post('/login', checkAccessToPage, controllerUser.login)

router.get('/management', controllerUser.formManagement)
router.post('/management/update-role', auth, controllerUser.changeRole)
router.get('/management/delete/:id', auth, controllerUser.deleteUser)

router.get('/edit-profile/:id', auth, controllerUser.editProfileForm);
router.post('/edit-profile/:id', auth, uploadImageProfile, controllerUser.editProfile);

router.get('/logout', auth, controllerUser.logout)

module.exports = router;
