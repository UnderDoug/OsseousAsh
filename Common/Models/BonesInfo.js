const { DataTypes } = require('sequelize');

const BonesInfoModel = {
    ID: {
        type: DataTypes.UUID,
        autoIncrement: false,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    SaveBonesJSON: {
        type: DataTypes.JSON,
        allowNull: false,
        autoIncrement: false,
    },
    SavGz: {
        type: DataTypes.BLOB,
        allowNull: true,
        autoIncrement: false,
    },
};

module.exports = (sequelize) => sequelize.define('BonesInfo', BonesInfoModel);