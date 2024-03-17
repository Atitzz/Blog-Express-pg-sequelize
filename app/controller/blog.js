const db = require('../models/index');
const day = require("dayjs");
const { Op } = require("sequelize");
const fs = require("fs");

// index (show post & set page)
const index = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const message = req.flash("success");
    const category = await db.Category.findAll({
      order: [["name"]],
      indexHints: ["categoryName_index"],
    });

    // กำหนดเพื่อทำ pagination //
    const page = req.query.page || 1;
    const perPage = 5;

    const { count, rows: blogs } = await db.Blog.findAndCountAll({
      offset: (page - 1) * perPage,
      limit: perPage,
      order: [["title", "ASC"]],
      indexHints: ["title_index"],
    });

    const pageCount = Math.ceil(count / perPage);

    const commentCounts = [];

    // วนลูป blogs เพื่อนับจำนวน comment และ reply ของแต่ละ postId
    for (const blog of blogs) {
      const countComments = await db.Comment.count({
        where: { postId: blog.id },
      });
      const countReplies = await db.Reply.count({
        include: {
          model: db.Comment,
          where: { postId: blog.id },
        },
      });
      const totalCount = countComments + countReplies;
      commentCounts.push({ postId: blog.id, count: totalCount });
    }

    res.render("index", {
      categories: category,
      Blog: blogs,
      commentCounts,
      day: day,
      currentPage: page,
      pageCount: pageCount,
      message,
      user,
      showUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มบันทึกหมวดหมู่
const formCategory = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const message = req.flash("error");
    const category = await db.Category.findAll({});
    res.render("addCategory", {
      categories: category,
      message,
      user,
      showUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// บันทึกหมวดหมู่ 
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existingCategory = await db.Category.findOne({
      where: { name: name },
      indexHints: ["categoryName_index"],
    });

    if (req.user.role === "admin") {
      if (existingCategory) {
        req.flash("error", "มีหมวดหมู่นี้แล้ว");
        res.redirect("/category/add");
      } else {
        await Category.create({ name: name });
        res.redirect("/");
      }
    } else {
      req.flash("error", "คุณไม่มีสิทธิ์ในการเพิ่มหมวดหมู่");
      res.redirect("/category/add");
    }
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มบันทึกโพสต์
const formAddPost = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const userId = req.user.id;
    const username = req.user.username;
    const category = await db.Category.findAll({
      attributes: ["name"],
      order: [["name"]],
      indexHints: ["categoryName_index"],
    });
    res.render("addPost", {
      categories: category,
      user,
      username,
      userId,
      showUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// บันทึกโพสต์
const createPost = async (req, res) => {
  try {
    const { title, category, content, author, authorId } = req.body;
    const projectImage = req.file ? req.file.filename : null;

    const blog = await db.Blog.create({
      title,
      category,
      content,
      img: projectImage,
      author,
      authorId,
    });
    req.flash("success", `Blog created successfully By:  ${author}`);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มแก้ไขโพสต์
const formEdit = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const postId = req.params.id;
    const blog = await db.Blog.findByPk(postId);
    const category = await db.Category.findAll({
      attributes: ["name"],
      indexHints: ["categoryName_index"],
    });

    const message = req.flash("error");

    res.render("editPost", {
      blog: [blog],
      categories: category,
      user,
      message,
      showUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// แก้ไขโพสต์
const editPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, category, content } = req.body;
    const uploadedImage = req.file ? req.file.filename : null;

    const loggedInUserId = req.user.id;
    const existingPost = await db.Blog.findByPk(postId); //เอาไว้ค้นหา authorId, img

    if (loggedInUserId == existingPost.authorId) {
      if (uploadedImage) {
        if (existingPost && existingPost.img) {
          fs.unlinkSync("./public/images/" + existingPost.img);
        } else {
          await db.Blog.update(
            { title, category, content, img: uploadedImage },
            { where: { id: postId } }
          );
        }

      } else {
        await db.Blog.update(
          { title, category, content },
          { where: { id: postId } }
        );
      }
      req.flash("success", "Successfully updated");
      res.redirect(`/show/${postId}`);
    } else {
      req.flash("error", "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้");
      res.redirect(`/edit/${postId}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// show search results
const search = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const { search, category, author, page } = req.query;
    const categories = await db.Category.findAll({
      attributes: ["name"],
      order: [["name"]],
      indexHints: ["categoryName_index"],
    });

    const pageSize = 5; // จำนวนบทความต่อหน้า
    const currentPage = parseInt(page) || 1; // หน้าปัจจุบัน

    let blogs = [];
    let totalBlogs = 0;

    if (search) {
      const { count, rows } = await db.Blog.findAndCountAll({
        where: {
          [Op.or]: [
            { category: { [Op.iLike]: `%${search}%` } },
            { author: { [Op.iLike]: `%${search}%` } },
            { title: { [Op.iLike]: `%${search}%` } },
          ],
        },
        order: [["title", "ASC"]],
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        indexHints: ["title_index"],
      });
      blogs = rows;
      totalBlogs = count;
    } else if (author || category) {
      const query = {};
      if (author) {
        query.author = author;
      }
      if (category) {
        query.category = category;
      }

      const { count, rows } = await db.Blog.findAndCountAll({
        where: query,
        order: [["title", "ASC"]],
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        indexHints: ["title_index"],
      });
      blogs = rows;
      totalBlogs = count;
    } else {
      const { count, rows } = await db.Blog.findAndCountAll({
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        indexHints: ["title_index"],
      });
      blogs = rows;
      totalBlogs = count;
    }

    const totalPages = Math.ceil(totalBlogs / pageSize);

    res.render("show_search", {
      posts: blogs,
      categories: categories,
      search: search || author || category,
      day: day,
      user,
      currentPage,
      totalPages,
      showUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// กรณีไม่ได้สร้าง fk ให้ดึงข้อมูลจากการลูป //
// const author = async (req, res) => {
//     try {
//         const user = req.cookies && req.cookies.jwt
//         const showUser = req.cookies && req.cookies.user;

//         const authors = await db.User.findAll({
//             attributes: ['username', 'id', 'profileImage'],
//             order: [['username', 'ASC']],
//         });

//         const authorData = [];

//         for (let authorObj of authors) {
//             const author = authorObj.username
//             const authorId = authorObj.id
//             const profileImage = authorObj.profileImage

//             const titles = await db.Blog.findAll({
//                 attributes: ['title', 'id'],
//                 where: { author: author }
//             })

//             authorData.push({ author, titles, authorId, profileImage,  })
//         }

//         res.render('author', { authors: authorData, user, showUser });
//     } catch (error) {
//         console.error(error);
//     }
//};

// โชว์รายชื่อและโพสต์ของผู้เขียน
const author = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const author = await db.User.findAll({
      attributes: ["username", "id", "profileImage"],
      indexHints: ['username_index'],
      include: [
        {
          model: db.Blog,
          as: "blogs",
          attributes: ["title", "id"],
          indexHints: ['title_index']
        },
      ],
      order: [["username", "ASC"], ["blogs", "title", "ASC"]], //ถ้าเรียงลำดับ ของ model ที่ include ต้องแยกอีก Array และใส่ชื่อ model นำหน้าด้วย//
      where: {
        "$blogs.id$": { [Op.ne]: null },
        //'$blogs.id$' = คือการเข้าถึงข้อมูลของ model ที่ถูก include เข้ามา (ต้องเป็น fk)
      },
    });
    res.render("author", { authors: author, user, showUser });
  } catch (error) {
    console.error(error);
  }
};

// อ่านตัวเต็มของโพสต์
const readMore = async (req, res) => {
  try {
    const user = req.cookies && req.cookies.jwt;
    const showUser = req.cookies && req.cookies.user;

    const postId = req.params.id;
    const posts = await db.Blog.findByPk(postId);
    const category = await db.Category.findAll({
      attributes: ["name"],
      order: [["name"]],
      indexHints: ["categoryName_index"],
    });

    const message = req.flash("success");

    // แสดง comment เฉพาะ blog นั้นๆ
    const comments = await db.Comment.findAll({
      attributes: ["id", "content", "createdAt", "username"],
      where: { postId: postId },
      include: [
        {
          model: db.Reply,
          as: "Replies",
          attributes: ["id", "content", "createdAt", "username"],
        },
      ],
      indexHints: ["commentId_index", "replyId_index"]
    });

    res.render("show", {
      posts: [posts],
      categories: category,
      day: day,
      Comments: comments,
      user: user,
      message,
      showUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// เพิ่มคอมเมนท์
const addComment = async (req, res) => {
  try {
    const postId = req.params.id; //id ของ blog
    const userId = req.user.id; //id ของ user ที่ comment
    const username = req.user.username;
    const { comment } = req.body;

    const newComment = await db.Comment.create({
      postId,
      userId,
      content: comment,
      username: username,
    });

    res.redirect(`/show/${postId}`);
  } catch (error) {
    console.log(error);
  }
};

// ตอบคอมเมนท์
const reply = async (req, res) => {
  try {
    const postId = req.params.id; //id ของ blog
    const commentId = req.params.comment; //id ของ comment
    const userId = req.user.id; // id ของ user ที่ reply
    const username = req.user.username;
    const { reply } = req.body;

    const replyComment = await db.Reply.create({
      postId,
      commentId,
      userId,
      content: reply,
      username: username,
    });

    res.redirect(`/show/${postId}`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  index,
  formCategory,
  createCategory,
  formAddPost,
  createPost,
  formEdit,
  editPost,
  search,
  author,
  readMore,
  addComment,
  reply,
};
