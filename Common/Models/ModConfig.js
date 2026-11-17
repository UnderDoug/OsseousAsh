const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');
const { DB_DIALECT } = process.env;

const semver = require('semver')

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
                    references: {
                        model: 'Bones',
                        key: 'ID',
                    },
                    onDelete: 'cascade',
                    onUpdate: 'cascade',
                },
                BonesModVersion: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                    get() {
                        return semver.valid(semver.coerce(this.getDataValue('BonesModVersion')));
                    },
                    set(value) {
                        this.setDataValue('BonesModVersion', semver.valid(semver.coerce(value)));
                    }
                },
            },
            {
                defaultScope: {
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    include: ModConfig.forOutputCleanInclude,
                },
                scopes: {
                    includeIndex: {
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        include: ModConfig.forOutputInclude,
                    },
                    ofBones(BonesID) {
                        return {
                            where: {
                                ID: { [Op.is]: BonesID },
                            },
                        };
                    },
                },
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'ModConfig',
            }
        );
    };

    static forOutputInclude = [{
        association: 'Records',
        attributes: ['Index', 'ID', 'Version', 'Title'],
        through: {
            attributes: [],
        },
    }];

    static forOutputCleanInclude = [{
        association: 'Records',
        attributes: ['ID', 'Version', 'Title'],
        through: {
            attributes: [],
        },
    }];
}