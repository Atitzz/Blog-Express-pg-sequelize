const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const fs = require('fs');
const path = require('path');
const db = require('../models/index');


require("dotenv").config();
const config = process.env;

const { updateUserAndImage, updateUser } = require('./function/updateUser');

// แบบฟอร์มสมัครสมาชิก
const formRegister = (req, res) => {
    try {
        const message = req.flash('error');
        res.render("users/register", { message });
    } catch (error) {
        console.log(error);
    }
};

// สมัครสมาชิก (ตัวอย่างนี้ validate จาก controller) 
const register = async (req, res) => {
    try {
        const { email, username, password, confirmPassword } = req.body;
        const existingUser = await db.User.findOne({ where: { email: email }, indexHints: ['email_index'] });

        if (existingUser) {
            req.flash("error", "อีเมล์นี้ถูกใช้แล้ว");
            return res.redirect("/users/register");
        } else if (password !== confirmPassword) {
            req.flash("error", "รหัสผ่านไม่ตรงกัน")
            return res.redirect("/users/register");
        } else {
            // ตรวจสอบการกรอกข้อมูลของ user (จาก controller)
            const usernameIsValid = /^[a-zA-Z0-9]+$/.test(username);
            const passwordIsValid = /^[a-zA-Z0-9]+$/.test(password);

            if (!usernameIsValid) {
                req.flash("error", "ชื่อผู้ใช้ต้องมีตัวอักษร a-z และ 0-9 เท่านั้น โดยห้ามมีช่องว่าง");
                return res.redirect("/users/register");
            }
            if (!passwordIsValid) {
                req.flash("error", "รหัสผ่านต้องมีตัวอักษร a-z และ 0-9 เท่านั้น โดยห้ามมีช่องว่าง");
                return res.redirect("/users/register");
            }

            const hash = await bcrypt.hash(password, 10);
            const newUser = await db.User.create({
                email,
                username,
                password: hash,
                profileImage: 'user.jpg'
            });

            res.redirect("/users/registerSuccess");
        }
    } catch (error) {
        console.log(error);
    }
};

// สมัครสมาชิก (ตัวอย่างนี้ validate จาก model)
// const register = async (req, res) => {
//     try {
//         const { email, username, password, confirmPassword } = req.body;
//         const existingUser = await db.User.findOne({ where: { email: email }, indexHints: ['email_index'] });

//         if (existingUser) {
//             req.flash("error", "อีเมล์นี้ถูกใช้แล้ว");
//             return res.redirect("/users/register");
//         } else if (password !== confirmPassword) {
//             req.flash("error", "รหัสผ่านไม่ตรงกัน")
//             return res.redirect("/users/register");
//         } else {
//             try {
//                 const hash = await bcrypt.hash(password, 10);
//                 const newUser = await db.User.create({
//                     email,
//                     username,
//                     password: hash,
//                     profileImage: 'user.jpg'
//                 });
//                 res.redirect("/users/registerSuccess");
//             } catch (error) {
//                 // หากเกิดข้อผิดพลาดในการ validate จาก model
//                 if (error instanceof Sequelize.ValidationError) {
//                     const errorMessage = error.errors.map(err => err.message);
//                     req.flash("error", errorMessage.join(", "));
//                     return res.redirect("/users/register");
//                 }
//                 throw error; // ส่งข้อผิดพลาดที่ไม่ได้รับการจัดการไปยัง catch นอกจาก Sequelize ValidationError
//             }
//         }
//     } catch (error) {
//         console.log(error);
//     }
// };

// แบบฟอร์มเข้าสู่ระบบ
const formLogin = (req, res) => {
    try {
        const message = req.flash('error');
        res.render("users/login", { message });
    } catch (error) {
        console.log(error);
    }
};

// เข้าสู่ระบบ
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.User.findOne({ where: { email: email }, indexHints: ['email_index'] });
        if (!user) {
            req.flash("error", "ไม่มีชื่อนี้อยู่ในระบบ");
            return res.redirect("/users/login");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "รหัสผ่านไม่ถูกต้อง");
            return res.redirect("/users/login");
        }
        let payload = {
            user: {
                user: user,
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
        };
        const token = jwt.sign(payload, config.TOKEN, { expiresIn: "1h" })
        res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });  //ส่ง token
        res.cookie('user', user.username, { httpOnly: true, maxAge: 3600000 }); //ส่ง ชื่อ
        req.flash('success', user.username, 'เข้าสู่ระบบเรียบร้อยแล้ว');
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
};

// ออกจากระบบ
const logout = (req, res) => {
    try {
        res.clearCookie('jwt');
        res.clearCookie('user');
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
}

// แบบฟอร์มจัดการสมาชิก
const formManagement = async (req, res) => {
    try {
        const user = req.cookies && req.cookies.jwt;
        const showUser = req.cookies && req.cookies.user;
        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');

        const { search } = req.query
        let users = [];

        if (search) {
            users = await db.User.findAll({
                attributes: ['id', 'username', 'email', 'role'],
                where: {
                    [Op.or]: [
                        { username: { [Op.iLike]: `%${search}%` } },
                        { email: { [Op.iLike]: `%${search}%` } }
                    ]
                },
                order: [["username", "ASC"]],
                indexHints: ['email_index']
            });
        } else {
            users = await db.User.findAll({
                attributes: ['id', 'username', 'email', 'role'],
                order: [["username", "ASC"]],
                indexHints: ['email_index']

            });
        }

        res.render('users/admin', { users, successMessage, errorMessage, user, showUser });

    } catch (error) {
        console.log(error);
    }
};

// ปรับ user or admin
const changeRole = async (req, res) => {
    try {
        const user = req.user;
        const { userId, changeRole } = req.body;
        const users = await db.User.findByPk(userId);

        if (user && user.role === 'admin') {
            await db.User.update({ role: changeRole }, { where: { id: userId } });
            req.flash('success', `Updated user ${users.email}`);
        } else {
            req.flash('error', `คุณไม่ได้รับสิทธิ์การปรับตำแหน่ง`);
        }
        res.redirect('/users/management');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to update user role');
        res.redirect('/users/management');
    }
};

// ลบสมาชิก
const deleteUser = async (req, res) => {
    try {
        const user = req.user
        const userId = req.params.id
        const checkUser = await db.User.findByPk(userId)

        // ลบ account โดย admin //
        if (user && user.role === 'admin') {
            if (checkUser && checkUser.profileImage !== null && checkUser.profileImage !== 'user.jpg') {
                const imagePath = path.join(__dirname, '../public/profile/' + checkUser.profileImage)
                fs.unlinkSync(imagePath)
            }
            await db.User.destroy({ where: { id: userId } })

            req.flash('success', 'User deleted successfully')
            res.redirect('/users/management')

            // ลบ account ตัวเอง //
        } else if (user && user.id === checkUser.id) {
            if (checkUser && checkUser.profileImage !== null && checkUser.profileImage !== 'user.jpg') {
                fs.unlinkSync(imagePath)
            }
            await db.User.destroy({ where: { id: userId } })

            res.redirect('/users/logout')

        } else {
            req.flash('error', 'คุณไม่มีสิทธิในการจัดการสมาชิก');
            return res.redirect('/users/management');
        }
    } catch (error) {
        console.log(error);
    }
}

// แบบฟอร์มแก้ไขข้อมูลส่วนตัว
const editProfileForm = async (req, res) => {
    try {
        const user = req.cookies && req.cookies.jwt
        const showUser = req.cookies && req.cookies.user;

        const authorId = req.params.id;
        const author = await db.User.findByPk(authorId)
        const messageSuccess = req.flash('success');
        const messageError = req.flash('error');

        res.render('editProfile', { author, user, messageSuccess, messageError, showUser });
    } catch (error) {
        console.log(error);
    }
}

// แก้ไขข้อมูลส่วนตัว (รูป, ชื่อ)
const editProfile = async (req, res) => {
    try {
        const authorId = req.params.id;
        const { username } = req.body
        const image = req.file ? req.file.filename : null;
        const user = req.user.id

        const existingUser = await db.User.findByPk(authorId);

        if (user == existingUser.id) {
            if (image) {
                if (existingUser && existingUser.profileImage !== null && existingUser.profileImage !== 'user.jpg') {
                    const imagePath = path.join(__dirname, '../public/profile/' + existingUser.profileImage)
                    fs.unlinkSync(imagePath)
                }
                await updateUserAndImage(authorId, username, image);
            } else {
                await updateUser(authorId, username);
            }
            req.flash('success', 'Successfully updated')
            res.redirect(`/users/edit-profile/${authorId}`);
        } else {
            req.flash('error', 'คุณไม่มีสิทธิ์ในการอัพเดทข้อมูลนี้')
            res.redirect(`/users/edit-profile/${authorId}`);
        }
    } catch (error) {
        console.log(error);
    }
}

// แบบฟอร์มแจ้งเตือนหลังจากสมัครสมาชิกสำเร็จ
const registerSuccess = (req, res) => {
    try {
        res.render('users/registerSuccess');
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    formRegister, register, formLogin, login, logout,
    formManagement, changeRole, deleteUser, editProfileForm, editProfile, registerSuccess
}