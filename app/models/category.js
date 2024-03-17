const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Category extends Model { }
    Category.init(
        {
            name: {
                type: DataTypes.STRING(30),
            },
        },
        {
            sequelize,
            modelName: "Category",
            timestamps: true,
            indexes: [
                {
                    name: "categoryName_index",
                    fields: ["name"],
                },
            ],
        }
    );
    return Category;
};
