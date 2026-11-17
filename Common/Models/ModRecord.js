const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');
const semver = require('semver');

module.exports.ModRecord = class ModRecord extends Model {
    static {
        ModRecord.init(
            {
                Index: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                ID: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                    unique: 'ID_Version',
                    // primaryKey: true,
                },
                Version: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                    unique: 'ID_Version',
                    // primaryKey: true,
                    /*get() {
                        return semver.valid(semver.coerce(this.getDataValue('Version')));
                    },
                    set(value) {
                        this.setDataValue('Version', semver.valid(semver.coerce(value)));
                    }*/
                },
                Title: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: true,
                },
            },
            {
                defaultScope: {
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
                scopes: {
                    ofModConfig_Record(ModRecordIndex) {
                        return {
                            where: {
                                Index: { [Op.is]: ModRecordIndex },
                            },
                        };
                    },
                },
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'ModRecord',
            }
        );
        /*ModRecord.beforeValidate(async (record, options) => {
            try {
                if (!record.Version) {
                    record.Version = '0.0.0';
                }
            }
            catch (err) {
                logger.error(JSON.stringify(err, null, 4));
                throw err;
            }
        });*/
    }
    /*isNewerThan(Other) {
        try {
            return !Other?.Version
                || semver.gt(semver.valid(semver.coerce(this.Version)), semver.valid(semver.coerce(Other.Version)));
        }
        catch (err) {
            logger.warn(`Failed isNewerThan check for '${this.Version}' and '${Other?.Version}'`);
        }
    }
    isOlderThan(Other) {
        try {
            return Other?.Version
                && semver.lt(semver.valid(semver.coerce(this.Version)), semver.valid(semver.coerce(Other.Version)));
        }
        catch (err) {
            logger.warn(`Failed isOlderThan check for '${this.Version}' and '${Other?.Version}'`);
        }
    }*/
}