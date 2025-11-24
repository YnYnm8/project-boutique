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
            port: 3306,
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
            },
            role: {
                type: DataTypes.ENUM("user", "admin"),
                defaultValue: "user"
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
            birth_date: "19941104",
            role: "admin"
        });
        const usertwo = await User.create({
            name: "Meiko",
            email: "meiko@mail.com",
            password: "1234",
            phone_number: "0765456746",
            birth_date: "19941104"
        });

        // -------------------------------
        // SEED : Ajout des données Bento
        // -------------------------------

        // Catégorie “Bento”
        const categoryBento = await Category.create({
            title: "Bento japonais"
        });

        // 4 types de bento (tous à 12€)
        const produits = await Product.bulkCreate([
            {
                name: "Bento du jour",
                description: "Un délicieux bento japonais préparé avec des ingrédients frais du jour.",
                price: 12,
                category_id: categoryBento.id
            },
            {
                name: "Bento curry",
                description: "Curry japonais doux accompagné de riz fraîchement cuit.",
                price: 12,
                category_id: categoryBento.id
            },
            {
                name: "Bento onigiri",
                description: "Deux onigiris généreux servis avec accompagnements variés.",
                price: 12,
                category_id: categoryBento.id
            },
            {
                name: "Bento karaage",
                description: "Poulet frit karaage croustillant avec salade et riz.",
                price: 12,
                category_id: categoryBento.id
            }
        ]);

        // Images associées
        await Image.bulkCreate([
            { url: "https://exemple.com/bento-jour.jpg", product_id: produits[0].id },
            { url: "https://exemple.com/bento-curry.jpg", product_id: produits[1].id },
            { url: "https://exemple.com/bento-onigiri.jpg", product_id: produits[2].id },
            { url: "https://exemple.com/bento-karaage.jpg", product_id: produits[3].id }
        ]);

        // Caractéristiques (exemples)
        const caracPoids = await Carac.create({ name: "Poids", unit: "g" });
        const caracCalories = await Carac.create({ name: "Calories", unit: "kcal" });

        // Valeurs CaracProduct
        await CaracProduct.bulkCreate([
            { product_id: produits[0].id, carac_id: caracPoids.id, value: "650" },
            { product_id: produits[0].id, carac_id: caracCalories.id, value: "820" },

            { product_id: produits[1].id, carac_id: caracPoids.id, value: "700" },
            { product_id: produits[1].id, carac_id: caracCalories.id, value: "900" },

            { product_id: produits[2].id, carac_id: caracPoids.id, value: "500" },
            { product_id: produits[2].id, carac_id: caracCalories.id, value: "620" },

            { product_id: produits[3].id, carac_id: caracPoids.id, value: "720" },
            { product_id: produits[3].id, carac_id: caracCalories.id, value: "850" }
        ]);

        // Ajout de reviews FR
        await Review.bulkCreate([
            {
                rating: 5,
                content: "Un des meilleurs bentos que j’ai mangés ! Très frais et savoureux.",
                user_id: userOne.id,
                product_id: produits[0].id
            },
            {
                rating: 4,
                content: "Le curry est délicieux, pas trop épicé. Je recommande.",
                user_id: userOne.id,
                product_id: produits[1].id
            },
            {
                rating: 5,
                content: "Les onigiris sont parfaits, comme au Japon !",
                user_id: userOne.id,
                product_id: produits[2].id
            },
            {
                rating: 5,
                content: "Karaage croustillant et très bon goût. Excellent rapport qualité/prix.",
                user_id: userOne.id,
                product_id: produits[3].id
            }
        ]);

        console.log("SEED des bento ajouté !");




        return sequelize;

    } catch (error) {
        console.error(error);
        throw Error("Échec du chargement de Sequelize");
    }
}