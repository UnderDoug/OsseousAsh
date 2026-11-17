const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('../database');
const { logger } = require('../logger');

module.exports.BonesStatsCategoryEntry = class BonesStatsCategoryEntry extends Model {
    static {
        BonesStatsCategoryEntry.init(
            {
                ID: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                BonesStatsCategoryID: {
                    type: DataTypes.INTEGER,
                    references: {
                        model: 'BonesStatsCategory',
                        key: 'ID',
                    },
                },
                UserID: {
                    type: DataTypes.UUID,
                    references: {
                        model: 'User',
                        key: 'ID',
                    },
                    allowNull: false,
                },
                Value: {
                    type: DataTypes.INTEGER,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: 0,
                },
            },
            {
                defaultScope: {
                    // attributes: { exclude: ['BonesStatsCategoryID', 'ID', 'createdAt', 'updatedAt'] },
                    /*include: [
                        {
                            model: 'BonesStatsCategory',
                            through: {
                                attributes: ['StatCategoryName'],
                            }
                        },
                    ],*/
                },
                scopes: {
                    ofModConfig(ModConfigID) {
                        return {
                            where: {
                                ModConfigID: { [Op.is]: ModConfigID },
                            },
                        };
                    },
                },
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'BonesStatsCategoryEntry',
            }
        );
    }
}