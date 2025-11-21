import { Sequelize, DataTypes } from "sequelize";
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

        

        return sequelize;

    } catch (error) {
        console.error(error);
        throw Error("Échec du chargement de Sequelize");
    }
}