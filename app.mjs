import { loadSequelize } from "./database.mjs";
// FR : Importation de la fonction pour charger Sequelize et les modèles.
// JP : Sequelize とモデルを読み込む関数のインポート。

import express from "express";
// FR : Framework utilisé pour créer l’API REST.
// JP : REST API を作成するためのフレームワーク。

import jwt from "jsonwebtoken";
// FR : Librairie permettant de créer et vérifier des JWT.
// JP : JWT を作成・検証するライブラリ。

import cookieParser from 'cookie-parser';
// FR : Middleware pour lire les cookies envoyés par le client.
// JP : クライアントから送られるクッキーを読み取るミドルウェア。

import cors from "cors";
// FR : Middleware CORS (non utilisé dans ce code).
// JP : CORS ミドルウェア（このコードでは使用していない）。

import bcrypt from "bcrypt";
// FR : Sert à hasher et vérifier les mots de passe.
// JP : パスワードのハッシュ化・比較に使われる。

async function main() {

    const sequelize = await loadSequelize();
    // FR : Chargement de Sequelize et accès aux modèles.
    // JP : Sequelize をロードしモデルへアクセス。

    const User = sequelize.models.User;

    // FR : Récupération des modèles User, Post, Comment.
    // JP : User / Post / Comment モデルを取得。


    const app = express();
    // FR : Création de l’application Express.
    // JP : Express アプリを作成。

    app.use(express.json());
    // FR : Permet à Express de lire les JSON du body des requêtes.
    // JP : リクエスト body の JSON を読み取れるようにする。

    app.use(cookieParser());
    // FR : Permet d’accéder aux cookies via req.cookies.
    // JP : req.cookies でクッキーを読み取れるようにする。


    // ---------------------------
    // REGISTER : Inscription
    // ---------------------------
    // FR : Route permettant l'inscription d'un utilisateur.
    // JP : ユーザー登録用のルート。
    app.post('/register', async (req, res) => {
        const { name, email, phone_number, birth_date, password, verifiedPassword } = req.body;

        if (!name || !email || !phone_number || !birth_date || !password || !verifiedPassword) {
            // FR : Vérifie que tous les champs obligatoires sont fournis.
            // JP : すべての必須項目が入力されているかチェック。
            return res.status(400).json(new DTO('Tous les champs sont obligatoires'));
        }

        if (password !== verifiedPassword) {
            // FR : Vérifie que les deux mots de passe correspondent.
            // JP : パスワードが一致しているかチェック。
            return res.status(400).json(new DTO('Passwords do not match'));
        }

        try {
            // FR : Création d’un nouvel utilisateur.
            // JP : 新しいユーザーを作成。
            const newUser = await User.create({ name, email, phone_number, birth_date, password });
            console.log(newUser);
            res.status(201).json({
                message: 'User registered successfully',
                userId: newUser.id,
                name: newUser.name,


            });

        } catch (error) {
            // FR : Erreur lors de l’insertion DB.
            // JP : DB 登録中にエラーが発生した場合。
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    });


    // ---------------------------
    // LOGIN : Connexion
    // ---------------------------
    const JWT_SECRET = 'votre_cle_secrete_pour_jwt';
    // FR : Clé servant à signer le JWT (à changer en production).
    // JP : JWT 署名に使う秘密鍵（本番では変更すべき）。

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            // FR : Champs requis non fournis.
            // JP : 必須項目が未入力。
            return res.status(400).json(new DTO('Email and password are required'));
        }

        try {
            // FR : Recherche de l'utilisateur via l'email.
            // JP : メールアドレスでユーザーを検索。
            const user = await User.findOne({ where: { email } });
            const isPasswordTheSame = bcrypt.compareSync(password, user.password);

            if (!user || !isPasswordTheSame) {
                // FR : Identifiants invalides.
                // JP : ログイン情報が正しくない。
                return res.status(401).json(new DTO('Invalid email or password'));
            }

            // FR : Création du JWT (valable 1 heure).
            // JP : JWT を 1 時間有効で作成。
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

            // FR : Stockage du token dans un cookie sécurisé.
            // JP : トークンを HTTP-only クッキーに保存。
            res.cookie('token', token, { httpOnly: true });

            // FR : Succès.
            // JP : ログイン成功。
            res.json({ message: 'Login successful' });

        } catch (error) {
            // FR : Erreur serveur interne.
            // JP : サーバー内部エラー。
            res.status(500).json(new DTO('Error logging in'));
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


    // ---------------------------
    // Middleware d’authentification JWT
    // ---------------------------
    // FR : Vérifie si le token est valide avant les routes protégées.
    // JP : 保護されたルートの前に JWT の有効性をチェック。
    app.use(isLoggedInJWT(User));


    // ---------------------------
    // POST : Création d’un post
    // ---------------------------
    // FR : Ajout d’un nouveau post.
    // JP : 新しい投稿を作成。
    app.post("/posts", async (req, res) => {
        const newPostData = req.body;

        try {
            const newPost = await Post.create({
                title: newPostData.title,
                content: newPostData.content,
                UserId: req.user.id
            });

            res.json("Route en cours.....")

        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création de la tâche" });
        }
    });


    // ---------------------------
    // POST : Ajouter un commentaire
    // ---------------------------
    // FR : Ajoute un commentaire à un post.
    // JP : 投稿にコメントを追加。
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


    // ---------------------------
    // LOGOUT
    // ---------------------------
    // FR : Supprime le cookie et déconnecte l’utilisateur.
    // JP : Cookie を削除しログアウトさせる。
    app.post("/logout", async (req, res) => {
        res.clearCookie("token");
        res.json({ message: "Logout!" })
    });


    // ---------------------------
    // Middleware : Vérification JWT
    // ---------------------------
    // FR : Vérifie le token, récupère l'utilisateur et attache req.user.
    // JP : トークンを検証し、ユーザー情報を req.user に追加。
    function isLoggedInJWT(UserModel) {
        return async (req, res, next) => {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized: No token provided' });
            }
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.userId = decoded.userId;

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


    // ---------------------------
    // Serveur
    // ---------------------------
    // FR : Démarre l’application.
    // JP : サーバーを起動。
    app.listen(3000, () => {
        console.log("Serveur démarré sur http://localhost:3000");
    });
}

main();
// FR : Lance l’application.
// JP : アプリを起動。


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
