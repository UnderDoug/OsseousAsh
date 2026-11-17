const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('../database');
const { logger } = require('../logger');
const { DB_DIALECT } = process.env;

const isPostgres = DB_DIALECT == 'postgres';

module.exports.StatCategory = class StatCategory extends Model {
    static {
        StatCategory.init(
            {
                Name: {
                    type: DataTypes.STRING,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
            },
            {
                defaultScope: {
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
                scopes: {
                    ofBonesStats(BonesID) {
                        return {
                            includes: {
                                model: 'BonesStats',
                                as: 'BonesStats',
                                required: true,
                                through: {
                                    where: {
                                        BonesStatsID: { [Op.is]: BonesID },
                                    }
                                }
                            },
                        };
                    },
                },
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'StatCategory',
            }
        );
    }
}