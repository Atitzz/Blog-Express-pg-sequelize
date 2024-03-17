const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Blog, {
                foreignKey: "authorId",
                as: "blogs",
            });
            User.hasMany(models.Comment, {
                foreignKey: "userId",
            });
            User.hasMany(models.Reply, {
                foreignKey: "userId",
            });
        }
    }
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            username: {
                type: DataTypes.STRING(30),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    is: /^[a-zA-Z0-9]+$/,
                },
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            profileImage: {
                type: DataTypes.TEXT,
                defaultValue: "user.jpg",
            },
        },
        {
            sequelize,
            modelName: "User",
            timestamps: true,
            indexes: [
                {
                    name: 'email_index',
                    fields: ['email']
                }
            ]
        }
    );
    return User;
};
