const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');
const { DB_DIALECT } = process.env;

const isPostgres = DB_DIALECT == 'postgres';

module.exports.BonesStats = class BonesStats extends Model {
    static {
        BonesStats.init(
            {
                ID: {
                    type: DataTypes.UUID,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                Stats: {
                    type: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
                    autoIncrement: false,
                    allowNull: false,
                },
            },
            {
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'BonesStats',
            }
        );
    };
}