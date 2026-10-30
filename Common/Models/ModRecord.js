const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');
const semver = require('semver')

module.exports.ModRecord = class ModRecord extends Model {
    static {
        ModRecord.init(
            {
                ID: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                Title: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: true,
                },
                Version: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                    get() {
                        return semver.valid(this.getDataValue('Version'));
                    },
                    set(value) {
                        this.setDataValue('Version', semver.valid(value));
                    }
                },
            },
            {
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'ModRecord',
            }
        );
    };
    isNewerThan(Other) {
        return semver.gt(this.Version, Other.Version)
    }
    isOlderThan(Other) {
        return semver.lt(this.Version, Other.Version)
    }
}