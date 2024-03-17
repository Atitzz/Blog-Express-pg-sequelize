const express = require("express");
const router = express.Router();

const controllerBlog = require("../controller/blog");
const auth = require('../middleware/auth');
const { uploadImageBlog } = require('../middleware/upload');

router.get("/", controllerBlog.index);

router.get("/category/add", auth, controllerBlog.formCategory);
router.post("/category/add", auth, controllerBlog.createCategory);

router.get("/post/add", auth, controllerBlog.formAddPost);
router.post("/post/add", auth, uploadImageBlog, controllerBlog.createPost);

router.get("/edit/:id", auth, controllerBlog.formEdit);
router.post("/edit/:id", auth, uploadImageBlog, controllerBlog.editPost);

router.get("/show/:id", controllerBlog.readMore);
router.post('/show/:id', auth, controllerBlog.addComment);
router.post('/show/:id/:comment', auth, controllerBlog.reply);

router.get("/posts/show/", controllerBlog.search);

router.get('/author', controllerBlog.author);

module.exports = router;