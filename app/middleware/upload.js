const multer = require('multer');

// อัพโหลดโพสต์
const storageBlog = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg");
  }
});

const uploadImageBlog = multer({ storage: storageBlog, }).single('img')

// อัพโหลดรูปโปรไฟล์
const storageProfile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/profile');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg");
  }
});

const uploadImageProfile = multer({ storage: storageProfile }).single('img')


module.exports = { uploadImageBlog, uploadImageProfile };