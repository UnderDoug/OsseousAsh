const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('../database');
const { logger } = require('../logger');

module.exports.ModConfigRecord = class ModConfigRecord extends Model {
    static {
        ModConfigRecord.init(
            {
                ID: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                /*ModConfigID: {
                    type: DataTypes.UUID,
                    references: {
                        model: 'ModConfig',
                        key: 'ID',
                    },
                    allowNull: false,
                },
                ModRecordIndex: {
                    type: DataTypes.INTEGER,
                    references: {
                        model: 'ModRecord',
                        key: 'Index',
                    },
                    allowNull: false,
                },*/
            },
            {
                defaultScope: {
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
                modelName: 'ModConfigRecord',
                timestamps: false,
            }
        );
    }
}