const { DataTypes } = require('sequelize');

const BonesSpec = {
    ID: {
        type: DataTypes.UUID,
        autoIncrement: false,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    Level: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ZoneID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ZoneZ: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ZoneTier: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ZoneTerrainType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    RegionTier: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    TerrainTravelClass: {
        type: DataTypes.STRING,
        allowNull: false,
    },
};

module.exports = (sequelize) => sequelize.define('BonesSpec', BonesSpec);