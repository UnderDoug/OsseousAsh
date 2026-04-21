const { DataTypes } = require('sequelize');

const BonesInfoModel = {
    ID: {
        type: 'UUID',
        autoIncrement: false,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    SaveBonesJSON: {
        type: 'JSON',
        allowNull: false,
        autoIncrement: false,
    },
    SavGz: {
        type: 'BYTEA',
        allowNull: true,
        autoIncrement: false,
    },
};

module.exports = (sequelize) => sequelize.define('BonesInfo', BonesInfoModel);