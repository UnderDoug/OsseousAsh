const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('../database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.User = class User extends Model {
    static {
        User.init(
            {
                ID: {
                    type: DataTypes.UUID,
                    autoIncrement: false,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                Handle: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                Status: {
                    type: DataTypes.ENUM('None', 'Pending', 'Active', 'Disabled'),
                    allowNull: false,
                },
                Access: {
                    type: DataTypes.ENUM('None', 'Down', 'Up', 'Manage'),
                    allowNull: false,
                },
                Password: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    get() {
                        if (this.getDataValue('Password')) {
                            return '********';
                        }
                        return null;
                    },
                    /*set(value) {
                        this.setDataValue('Password', value);
                        console.log({ value: value, getDataValue: this.getDataValue('Password') });
                    }*/
                },
                // auto-flagged when user bulk reports or does other automated seeming behaviour.
                // internal only; makes spotting problem behaviour easier.
                Suspicious: { 
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                // manually flagged when user is found to be griefing/offensive.
                // 'naughty' bones can only be served to users with this flag.
                Naughty: { 
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
            },
            {
                defaultScope: {
                    attributes: { exclude: ['Password'] },
                },
                scopes: {
                    includePassword: {
                    },
                    pending: {
                        attributes: { exclude: ['Password'] },
                        where: {
                            Status: 'Pending',
                        },
                    },
                    disabled: {
                        attributes: { exclude: ['Password'] },
                        where: {
                            Status: 'Disabled',
                        },
                    },
                    canManage: {
                        attributes: { exclude: ['Password'] },
                        where: {
                            Status: 'Active',
                            Access: 'Manage',
                        },
                    },
                    forBones: {
                        attributes: ['ID', 'Handle'],
                    },
                },
                freezeTableName: true,
                sequelize: sequelize,
                modelName: 'User'
            }
        );
        User.beforeCreate(async (user, options) => {
            try {
                const userPassword = user.passwordValue();
                if (userPassword) {
                    const hash = await bcrypt.hash(user.passwordValue(), saltRounds);
                    user.Password = hash;
                }
            }
            catch (error) {
                logger.error(error);
                throw error;
            }
        });
        User.beforeUpdate(async (user, options) => {
            if (user.changed('Password')) {
                try {
                    const userPassword = user.passwordValue();
                    if (userPassword) {
                        const hash = await bcrypt.hash(user.passwordValue(), saltRounds);
                        user.Password = hash;
                    }
                }
                catch (error) {
                    logger.error(error);
                    throw error;
                }
            }
        });
    };
    passwordValue() {
        return this.getDataValue('Password');
    }
}