import { loadSequelize } from "./database.mjs";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';
import cors from "cors";
import bcrypt from "bcrypt";


async function main() {

    const sequelize = await loadSequelize();
    const app = express();

    const User = sequelize.models.User;
    const Product = sequelize.models.Product;
    const Review = sequelize.models.Review;
    const Image = sequelize.models.Image;
    const Category = sequelize.models.Category;

    const JWT_SECRET = 'votre_cle_secrete_pour_jwt';

    app.use(express.json());
    app.use(cookieParser());

    // Route Register
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

    // Route Login
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

    // Route All-Products
    app.get("/products", async (req, res) => {
        try {

            const allProducts = await Product.findAll();
            res.json(allProducts);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // Route Product-By Id
    app.get("/product/:id", async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findByPk(productId);
            res.json(product);
        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });


    app.post("/product", async (req, res) => {
        const newProductData = req.body;

        try {
            const newProduct = await Product.create({
                name: newProductData.name,
                price: newProductData.price,
                description: newProductData.description,
                category_id: 1
            });

            res.json("Produit ajouté");

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création de la tâche" });
        }
    });

    app.delete("/product/:productId", async (req, res) => {

        try {
            const productId = req.params.productId;
            const userRole = req.user.role;

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
    // Route Put-Product By Id
    app.put("/product/:id", async (req, res) => {

        const productId = req.params.id;
        const newProductData = req.body;

        try {
            const [updated] = await Product.update({
                name: newProductData.name,
                price: newProductData.price,
                description: newProductData.description,
                category_id: 1
            }, {
                where: { id: productId }
            });

            if (!updated) {
                return res.status(404).json({ error: "Produit non trouvé" });
            }
            const updatedProduct = await Product.findByPk(productId);
            return res.json(updatedProduct);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    });

    app.get("/user/:id", async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await User.findByPk(userId);
            res.json(user);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });



    app.get("/users", async (req, res) => {
        try {
            const users = await User.findAll();
            res.json(users);

        } catch (error) {
            res.status(500).json(new DTO("Error"));
        }
    });

    app.get("/categories", async (req, res) => {
        try {

            const allCategories = await Category.findAll();
            res.json(allCategories);

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    // Route Get-Category By Id
    app.get("/category/:categoryId", async (req, res) => {
        try {

            const category_id = req.params.categoryId;

            const category = await Category.findOne({ where: { id: category_id } });
            res.json(category)

        } catch (error) {
            res.status(500).json(new DTO("Error"))
        }
    });

    app.post("/category", async (req, res) => {
        const
    })
    // << !! Middleware pour protection des routes !! >>
    app.use(isLoggedInJWT(User));


    // Route Add-Review
    app.post("/review", async (req, res) => {
        const newReviewData = req.body;

        try {
            const newReview = await Review.create({
                content: newReviewData.content,
                UserId: req.user.id
            });

            res.json(newReview);

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création de la Review" });
        }
    });

    // Route Put-Review
    app.post("/posts/:postId/comments", async (req, res) => {
        const newCommentData = req.body;
        const postId = req.params.postId;

        try {
            const newComment = await Comment.create({
                content: newCommentData.content,
                UserId: req.userId,
                PostId: postId
            });

            res.json("Commentaire ajouté");

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création de la tâche" });
        }
    });


    // ---------------------------
    // DELETE : Supprimer un post
    // ---------------------------
    // FR : Seul l’auteur ou l’admin peut supprimer un post.
    // JP : 投稿の削除は本人または管理者のみ可能。
    app.delete("/posts/:postid", async (req, res) => {

        try {
            const postId = req.params.postid;
            const userRole = req.user.role;
            const userId = req.userId;

            if (userId !== postId && userRole !== "admin") {
                return res.json("Vous n'avez pas le droit pour supprimer ce commentaire");
            }

            await Post.destroy({
                where: { id: postId }
            });

            return res.json("Post supprimé")

        } catch (error) {
            res.status(500).json(new DTO("Erreur"));
        }
    });


    // ---------------------------
    // DELETE : Supprimer un commentaire
    // ---------------------------
    // FR : Seul l’auteur ou l’admin peut supprimer un commentaire.
    // JP : コメントの削除は本人か管理者のみ可能。
    app.delete("/comments/:commentId", async (req, res) => {

        try {
            const userId = req.userId;
            const userRole = req.user.role;
            const commentId = req.params.commentId;

            const comment = await Comment.findOne({
                where: { id: commentId }
            });

            const userCommentId = comment.UserId;

            if (userId !== userCommentId && userRole !== "admin") {
                return res.json({ message: "Vous n'avez pas le droit pour supprimer ce commentaire" });
            }

            await Comment.destroy({
                where: { id: commentId }
            });

            return res.json({ message: "Comment supprimé" });

        } catch (error) {
            res.status(500).json({ error: "Erreur" });
        }
    });

    // Route Put-User
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
                },
                {
                    where: { id: userId }
                }
            );

            if (!updated) {
                return res.status(404).json({ error: "Utilisateur non trouvé" });
            }

            // Récupérer l’utilisateur mis à jour
            const updatedUser = await User.findByPk(userId);

            return res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    });

    // Route LOGOUT
    app.post("/logout", async (req, res) => {
        res.clearCookie("token");
        res.json({ message: "Logout!" })
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

    // Serveur
    app.listen(3000, "0.0.0", () => {
        console.log("Serveur démarré sur http://localhost:3000");
    });
}

main();


class DTO {
    message;
    data = null;
    constructor(message, data = null) {
        this.message = message;
        this.data = data;
    }
}
// FR : Objet utilisé pour structurer les réponses JSON.
// JP : JSON レスポンスを統一フォーマット化するための DTO。