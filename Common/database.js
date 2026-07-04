if (!process.env.NODE_ENV) {
    require('dotenv').config();
}

const {
    DB_NAME,
    DB_HOST,
    DB_USER,
    DB_PASS,
    DB_DIALECT,
} = process.env;

const { Sequelize } = require('sequelize');

const dbConfig = {
    name: DB_NAME || 'OsseousAsh',
    host: DB_HOST || 'localhost',
    user: DB_USER || '',
    password: DB_PASS || '',
    dialect: DB_DIALECT || 'postgres',
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