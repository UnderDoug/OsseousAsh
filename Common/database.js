const { Sequelize } = require('sequelize');
const args = process.argv.slice(2);

var username = args[0] ?? '';
var password = args[1] ?? '';

var host = args[2] ?? 'localhost'

const sequelize = new Sequelize(
    'OsseousAsh',
    username,
    password,
    {
        host: host,
        dialect: 'postgres'
    }
);

module.exports = sequelize;