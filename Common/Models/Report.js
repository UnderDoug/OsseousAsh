const { DataTypes } = require('sequelize');

const ReportModel = {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    OsseousAshID: {
        type: DataTypes.UUID,
        autoIncrement: false,
        allowNull: false,
    },
    BonesID: {
        type: DataTypes.UUID,
        autoIncrement: false,
        allowNull: false,
    },
    Type: {
        type: DataTypes.ENUM('None', 'Offensive', 'Griefing', 'Broken', 'Other'),
        allowNull: false,
        autoIncrement: false,
    },
    ObjectDetails: {
        type: DataTypes.JSON,
        allowNull: true,
        autoIncrement: false,
    },
    Description: {
        type: DataTypes.TEXT,
        allowNull: true,
        autoIncrement: false,
    },
    Actioned: {
        type: DataTypes.ENUM('None', 'Waiting', 'NonIssue', 'Deleted', 'Other'),
        allowNull: false,
        autoIncrement: false,
    },
};

module.exports = (sequelize) => sequelize.define('Report', ReportModel);