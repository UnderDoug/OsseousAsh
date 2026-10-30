const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { DB_DIALECT } = process.env;

const isPostgres = DB_DIALECT == 'postgres';

module.exports.Bones = class Bones extends Model {
    static {
        Bones.init(
            {
                ID: {
                    type: DataTypes.UUID,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                SaveBonesJSON: {
                    type: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
                    allowNull: false,
                    autoIncrement: false,
                },
                Size: {
                    type: Sequelize.VIRTUAL,
                    get() {
                        let savGz = this.getDataValue('SavGz');
                        if (savGz) {
                            return Buffer.byteLength(savGz);
                        }
                        return 0;
                    }
                },
                SavGz: {
                    type: isPostgres ? DataTypes.BLOB : DataTypes.BLOB('medium'),
                    allowNull: true,
                    autoIncrement: false,
                },
            },
            {
                defaultScope: {
                    where: {
                        SavGz: { [Op.not]: null },
                    },
                },
                scopes: {
                    pending: {
                        where: {
                            SavGz: { [Op.is]: null },
                        },
                    },
                    ofUser(UserID) {
                        return {
                            where: {
                                UserID: { [Op.is]: UserID },
                                SavGz: { [Op.is]: null },
                            },
                        };
                    },
                },
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'Bones',
                /*timestamps: true,
                createdAt: false,*/
            }
        );
    };
    isNaughty() {
        return this.getUser()
            && this.getUser().Naughty;
    }
}