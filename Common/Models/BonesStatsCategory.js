const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('../database');
const { logger } = require('../logger');

module.exports.BonesStatsCategory = class BonesStatsCategory extends Model {
    static {
        BonesStatsCategory.init(
            {
                ID: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                BonesStatsID: {
                    type: DataTypes.UUID,
                    references: {
                        model: 'BonesStats',
                        key: 'ID',
                    },
                    allowNull: false,
                },
                StatCategoryName: {
                    type: DataTypes.STRING,
                    references: {
                        model: 'StatCategory',
                        key: 'Name',
                    },
                    allowNull: false,
                },
            },
            {
                defaultScope: {
                    // attributes: { exclude: ['ID', 'BonesStatsID', 'StatCategoryName'] },
                    include: {
                        association: 'Entries',
                        attributes: ['UserID', 'Value'],
                    },
                },
                scopes: {
                    clean: {
                        attributes: ['StatCategoryName'],
                        include: {
                            association: 'Entries',
                            attributes: ['UserID', 'Value'],
                        },
                    },
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
                modelName: 'BonesStatsCategory',
                timestamps: false,
            }
        );
    }
}