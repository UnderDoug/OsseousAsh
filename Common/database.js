if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const { Sequelize } = require('sequelize');

const dbConfig = {
    name: process.env.DB_NAME || 'OsseousAsh',
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    dialect: process.env.DB_DIALECT || 'postgres',
};

const sequelize = new Sequelize(
    dbConfig.name,
    dbConfig.user,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
    }
);

module.exports = sequelize;