const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');
const { DB_DIALECT } = process.env;

const isPostgres = DB_DIALECT == 'postgres';

module.exports.ModConfig = class ModConfig extends Model {
    static {
        ModConfig.init(
            {
                ID: {
                    type: DataTypes.UUID,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                BonesModVersion: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                    get() {
                        return semver.valid(this.getDataValue('BonesModVersion'));
                    },
                    set(value) {
                        this.setDataValue('BonesModVersion', semver.valid(value));
                    }
                },
            },
            {
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'ModConfig',
            }
        );
    };
}