const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Blog extends Model {
        static associate(models) {
            Blog.hasMany(models.Comment, {
                foreignKey: "postId",
            });
            Blog.hasMany(models.Reply, {
                foreignKey: "postId",
            });
            Blog.belongsTo(models.User, {
                foreignKey: "authorId",
            });
        }
    }
    Blog.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            title: DataTypes.STRING,
            category: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            content: DataTypes.TEXT,
            img: DataTypes.TEXT,
            authorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                foreignKey: true
            },
            author: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Blog",
            timestamps: true,
            indexes: [
                {
                    name: 'title_index',
                    fields: ['title'],
                }
            ]
        }
    );
    return Blog;
};
