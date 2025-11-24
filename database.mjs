import { Sequelize, DataTypes, DATE, STRING } from "sequelize";
import bcrypt from "bcrypt";
/**
 * 
 * @returns {Promise<Sequelize>}
 */
export async function loadSequelize() {
    try {

        const login = {
            database: "app-database",
            username: "root",
            password: "root"
        };
        const sequelize = new Sequelize(login.database, login.username, login.password, {
            host: '127.0.0.1',
            port: 3308,
            dialect: 'mysql'
        });

        const User = sequelize.define("User", {
            name: {
                type: DataTypes.STRING,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                }
            },
            phone_number: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            birth_date: {
                type: DataTypes.STRING,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                set(clearPassword) {
                    const hashedPassword = bcrypt.hashSync(clearPassword, 10);
                    this.setDataValue('password', hashedPassword);
                }
            }
        });


        const Role = sequelize.define("Role", {
            name: DataTypes.STRING,
            level: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        });

        const Cart = sequelize.define("Cart");

        const Review = sequelize.define("Review", {
            rating: DataTypes.INTEGER,
            content: DataTypes.STRING
        });


        const Product = sequelize.define("Product", {
            name: DataTypes.STRING,
            price: DataTypes.FLOAT,
            description: DataTypes.STRING

        });
        const Category = sequelize.define("Category", {
            title: DataTypes.STRING
        });

        const Image = sequelize.define("Image", {
            url: DataTypes.STRING
        });

        const Carac = sequelize.define("Carac", {
            name: DataTypes.STRING,
            unit: DataTypes.STRING
        });

        const CaracProduct = sequelize.define("CaracProduct", {
            value: DataTypes.STRING

        });

        // User <-> Role
        User.hasMany(Role, { foreignKey: "user_id" });
        Role.belongsTo(User, { foreignKey: "user_id" });

        // User <-> Cart
        User.hasOne(Cart, { foreignKey: "user_id" });
        Cart.belongsTo(User, { foreignKey: "user_id" });

        // User <-> Review
        User.hasMany(Review, { foreignKey: "user_id" });
        Review.belongsTo(User, { foreignKey: "user_id" });

        // Product <-> Review
        Product.hasMany(Review, { foreignKey: "product_id" });
        Review.belongsTo(Product, { foreignKey: "product_id" });

        // Category <-> Product
        Category.hasMany(Product, { foreignKey: "category_id" });
        Product.belongsTo(Category, { foreignKey: "category_id" });

        // Product <-> Image
        Product.hasMany(Image, { foreignKey: "product_id" });
        Image.belongsTo(Product, { foreignKey: "product_id" });

        // Cart <-> Product  (MANY-TO-MANY)
        Cart.belongsToMany(Product, {
            through: "CartProduct",
            foreignKey: "cart_id"
        });
        Product.belongsToMany(Cart, {
            through: "CartProduct",
            foreignKey: "product_id"
        });

        // Product <-> Carac (via CaracProduct)
        Product.belongsToMany(Carac, {
            through: CaracProduct,
            foreignKey: "product_id"
        });
        Carac.belongsToMany(Product, {
            through: CaracProduct,
            foreignKey: "carac_id"
        });







        await sequelize.sync({ force: true });



        const userOne = await User.create({
            name: "Amaury",
            email: "amaury@mail.com",
            password: "1234",
            phone_number: "0765456745",
            birth_date: "19941104"
        });



        return sequelize;

    } catch (error) {
        console.error(error);
        throw Error("Échec du chargement de Sequelize");
    }
}