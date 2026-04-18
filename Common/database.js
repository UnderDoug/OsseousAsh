const { Sequelize } = require('sequelize');

/*const sequelize = new Sequelize({
    dialect: 'postgres',
    storage: './storage/data.db',
    user: 'OsseousAsh',
    password: 'bones',
    host: 'localhost',
    port: 5432,
    ssl: false,
    clientMinMessages: 'notice',
});*/
sequelize = new Sequelize('postgres://OsseousAsh:bones@localhost:5432/OsseousAsh');
module.exports = sequelize;