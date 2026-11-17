const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');

module.exports.Session = class Session extends Model {
    static {
        Session.init(
            {
                ID: {
                    type: DataTypes.UUID,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                /*UserID: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'User',
                        key: 'ID',
                    },
                },*/
                Valid: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    autoIncrement: false,
                    allowNull: false,
                },
            },
            {
                defaultScope: {
                    //attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
                scopes: {
                    /*ofModConfig_Record(ModRecordIndex) {
                        return {
                            where: {
                                Index: { [Op.is]: ModRecordIndex },
                            },
                        };
                    },*/
                },
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'Session',
            }
        );
        Session.beforeValidate(async (session, options) => {
            try {
                if (!session.ID) {
                    session.ID = crypto.randomUUID();
                }
            }
            catch (err) {
                logger.error(JSON.stringify(err, null, 4));
                throw err;
            }
        });
    }
}