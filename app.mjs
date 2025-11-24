import { loadSequelize } from "./database.mjs";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';
import cors from "cors";
import bcrypt from "bcrypt";


async function main() {

    const sequelize = await loadSequelize();
    const app = express();

    // Table (model)
    const User = sequelize.models.User;
    const Category = sequelize.models.Category;
    const Product = sequelize.models.Product;
    const Image = sequelize.models.Image;
    const Review = sequelize.models.Review;

    // Clé secrète
    const JWT_SECRET = 'votre_cle_secrete_pour_jwt';

    app.use(cookieParser());
    app.use(express.json());

    // Post-Register
    app.post('/register', async (req, res) => {
        const { name, email, phone_number, birth_date, password, verifiedPassword } = req.body;

        if (!name || !email || !phone_number || !birth_date || !password || !verifiedPassword) {
            return res.status(400).json(new DTO('Tous les champs sont obligatoires'));
        }

        if (password !== verifiedPassword) {
            return res.status(400).json(new DTO('Passwords do not match'));
        }

        try {
            const newUser = await User.create({ name, email, phone_number, birth_date, password });
            console.log(newUser);
            res.status(201).json({
                message: 'User registered successfully',
                userId: newUser.id,
                name: newUser.name,


            });

        } catch (error) {
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    });

    // Post-Login
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json(new DTO('Email and password are required'));
        }
        try {
            const user = await User.findOne({ where: { email } });
            const isPasswordTheSame = bcrypt.compareSync(password, user.password);

            if (!user || !isPasswordTheSame) {
                return res.status(401).json(new DTO('Invalid email or password'));
            }

            const token = jwt.sign({ userId: user.id, userRole: user.role }, JWT_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, { httpOnly: true });

            res.json({ message: 'Login successful' });

        } catch (error) {
            res.status(500).json(new DTO('Error logging in'));
        }
    });

    // Get-All-Products
    app.get("/products", async (req, res) => {
        try {

            const allProducts = await Product.findAll();
            res.json(allProducts);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // Get-Product-By-Id
    app.get("/product/:id", async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findByPk(productId);
            res.json(product);
        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    //Get-All-Categories
    app.get("/categories", async (req, res) => {
        try {
            const allCategories = await Category.findAll();
            res.json(allCategories);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // Get-Category-By-Id
    app.get("/category/:categoryId", async (req, res) => {

        const category_id = req.params.categoryId;

        try {
            const category = await Category.findOne({ where: { id: category_id } });
            res.json(category)

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // Get-All-Reviews
    app.get("/reviews", async (req, res) => {
        try {
            const allReviews = await Review.findAll();
            res.json(allReviews);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // << !! Middleware pour protection des routes !! >>
    app.use(isLoggedInJWT(User));


    // LOGOUT
    app.post("/logout", async (req, res) => {
        res.clearCookie("token");
        res.json({ message: "Logout!" })
    });

    // Post-Review
    app.post("/review", async (req, res) => {

        const newReviewData = req.body;

        try {
            const newReview = await Review.create({
                content: newReviewData.content,
                UserId: req.userId
            });

            res.json(newReview);

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création de la Review" });
        }
    });

    // Put-Review-By-Id ** vraiment utile ?
    app.put("/review/:reviewId", async (req, res) => {

        const reviewId = req.params.reviewId;
        const newReviewData = req.body;
        const updateData = {};

        try {
            if (newReviewData.rating !== undefined) {
                updateData.rating = newReviewData.rating;
            }
            if (newReviewData.content !== undefined) {
                updateData.content = newReviewData.content;
            }

            const [updated] = await Review.update(updateData, {
                where: { id: reviewId }
            });

            if (!updated) {
                return res.status(404).json({ error: "Review non trouvée" });
            }
            const updatedReview = await Review.findByPk(reviewId);

            return res.json(updatedReview);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erreur serveur" });
        }
    });

    // Delete-Review-By-Id
    app.delete("/review/:reviewId", async (req, res) => {

        try {
            const reviewId = req.params.reviewId;
            const userRole = req.userRole;

            if (userRole !== "admin") {
                return res.json("Vous n'avez pas le droit pour effectuer cette action");
            }

            await Review.destroy({
                where: { id: reviewId }
            });

            return res.json("Review supprimée")

        } catch (error) {
            res.status(500).json(new DTO("Erreur"));
        }
    });

    // Get-User-By-Id
    app.get("/user/:id", async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await User.findByPk(userId);
            res.json(user);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // Put-User
    app.put("/user/:id", async (req, res) => {

        const userId = req.params.id;
        const newUserData = req.body;

        try {
            const [updated] = await User.update(
                {
                    name: newUserData.name,
                    password: newUserData.password,
                    email: newUserData.email,
                    birth_date: newUserData.birth_date
                }, {
                where: { id: userId }
            });

            if (!updated) {
                return res.status(404).json({ error: "Utilisateur non trouvé" });
            }
            const updatedUser = await User.findByPk(userId);
            return res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    });


    // << ROUTE ADMIN >> //

    // Get-All-Users
    app.get("/users", async (req, res) => {
        try {
            const users = await User.findAll();
            res.json(users);

        } catch (error) {
            res.status(500).json(new DTO("Error"));
        }
    });

    // CATEGORY
    // Post-Category
    app.post("/category", async (req, res) => {

        const newCategoryData = req.body;

        try {
            const newCategory = await Cate.create({
                title: newCategoryData.title
            });

            res.json(newCategory);

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création de la tâche" });
        }
    });

    // Put-Category-By-Id
    app.put("/category/:id", async (req, res) => {

        const categoryId = req.params.id;
        const newCategoryData = req.body;

        try {
            const [updated] = await Category.update({
                title: newCategoryData.title,

            }, {
                where: { id: categoryId }
            });

            if (!updated) {
                return res.status(404).json({ error: "Produit non trouvé" });
            }
            const updatedCategory = await Category.findByPk(categoryId);
            return res.json(updatedCategory);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    });

    // Delete-Category-By-Id
    app.delete("/category/:categoryId", async (req, res) => {

        try {
            const categoryId = req.params.categoryId;
            const userRole = req.userRole;

            if (userRole !== "admin") {
                return res.json("Vous n'avez pas le droit pour effectuer cette action");
            }

            await Category.destroy({
                where: { id: categoryId }
            });

            return res.json("Category supprimé")

        } catch (error) {
            res.status(500).json(new DTO("Erreur"));
        }
    });

    // Product
    // Post-Product
    app.post("/product", async (req, res) => {

        const newProductData = req.body;

        try {
            const newProduct = await Product.create({
                name: newProductData.name,
                price: newProductData.price,
                description: newProductData.description,
                category_id: newProductData.description || 1
            });

            res.json({
                message: "Produit ajouté avec succès",
                product: newProduct
            });

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création du produit" });
        }
    });

    // Put-Product By Id
    app.put("/product/:productId", async (req, res) => {

        const productId = req.params.productId;
        const newProductData = req.body;
        const updateData = {};

        try {
            if (newProductData.name !== undefined) {
                updateData.name = newProductData.name;
            }
            if (newProductData.price !== undefined) {
                updateData.price = newProductData.price;
            }
            if (newProductData.description !== undefined) {
                updateData.description = newProductData.description;
            }
            if (newProductData.category_id !== undefined) {
                updateData.category_id = newProductData.category_id;
            }

            const [updated] = await Product.update(updateData, {
                where: { id: productId }
            });

            if (!updated) { return res.status(404).json({ error: "Produit non trouvé" }); }

            const updatedProduct = await Product.findByPk(productId);

            return res.json(updatedProduct);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erreur serveur" });
        }
    });

    // Delete-Product-By-Id
    app.delete("/product/:productId", async (req, res) => {

        try {
            const productId = req.params.productId;
            const userRole = req.userRole;

            if (userRole !== "admin") {
                return res.json("Vous n'avez pas le droit pour effectuer cette action");
            }

            await Product.destroy({
                where: { id: productId }
            });

            return res.json("Product supprimé")

        } catch (error) {
            res.status(500).json(new DTO("Erreur"));
        }
    });

    // Serveur
    app.listen(3000, "0.0.0", () => {
        console.log("Serveur démarré sur http://localhost:3000");
    });

    // Middleware : Vérification JWT
    function isLoggedInJWT(UserModel) {
        return async (req, res, next) => {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized: No token provided' });
            }
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.userId = decoded.userId;
                req.userRole = decoded.userRole;

                req.user = await UserModel.findByPk(req.userId);

                if (!req.user) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                next();

            } catch (error) {
                return res.status(401).json(new DTO('Unauthorized: Invalid token'));
            }
        }
    }

}

main();


// FR : Objet utilisé pour structurer les réponses JSON.
// JP : JSON レスポンスを統一フォーマット化するための DTO。
class DTO {
    message;
    data = null;
    constructor(message, data = null) {
        this.message = message;
        this.data = data;
    }
}