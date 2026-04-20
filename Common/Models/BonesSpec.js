const { DataTypes } = require('sequelize');

const BonesSpec = {
    ID: {
        type: 'UUID',
        autoIncrement: false,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    Level: {
        type: 'INTEGER',
        allowNull: false,
    },
    ZoneID: {
        type: 'VARCHAR(255)',
        allowNull: false,
    },
    ZoneZ: {
        type: 'INTEGER',
        allowNull: false,
    },
    ZoneTier: {
        type: 'INTEGER',
        allowNull: false,
    },
    ZoneTerrainType: {
        type: 'VARCHAR(255)',
        allowNull: false,
    },
    RegionTier: {
        type: 'INTEGER',
        allowNull: false,
    },
    TerrainTravelClass: {
        type: 'VARCHAR(255)',
        allowNull: false,
    },
};

module.exports = (sequelize) => sequelize.define('BonesSpec', BonesSpec);