const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const {
    USER_DEFAULT_HANDLE,
    USER_DEFAULT_STATUS,
    USER_DEFAULT_ACCESS,
} = process.env;
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
                    defaultValue: USER_DEFAULT_HANDLE,
                },
                Status: {
                    type: DataTypes.ENUM('None', 'Disabled', 'Pending', 'Active'),
                    allowNull: false,
                    defaultValue: USER_DEFAULT_STATUS,
                },
                Access: {
                    type: DataTypes.ENUM('None', 'Down', 'Up', 'Manage'),
                    allowNull: false,
                    defaultValue: USER_DEFAULT_ACCESS,
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
                /*SessionID: {
                    type: DataTypes.UUID,
                    autoIncrement: false,
                    allowNull: true,
                },*/
            },
            {
                defaultScope: {
                    attributes: { exclude: User.privateFields, },
                },
                scopes: {
                    public: {
                        attributes: { exclude: User.privateFields, },
                    },
                    private: {
                    },
                    publicWithPassword: {
                        attributes: { exclude: User.privateExclPassFields, },
                    },
                    withSessions: {
                        include: {
                            association: 'Sessions',
                            attributes: { exclude: ['UserID'], },
                        }
                    },
                    isPending: {
                        where: {
                            Status: 'Pending',
                        },
                    },
                    isDisabled: {
                        where: {
                            Status: 'Disabled',
                        },
                    },
                    isActive: {
                        where: {
                            Status: 'Active',
                        },
                    },
                    isNaughty: {
                        where: {
                            Naughty: true,
                        },
                    },
                    canManage: {
                        where: {
                            Status: 'Active',
                            Access: 'Manage',
                        },
                    },
                    canUp: {
                        where: {
                            Status: 'Active',
                            Access: {
                                [Op.or]: ['Up', 'Manage']
                            },
                        },
                    },
                    forBonesJSON: {
                        attributes: ['ID', 'Handle'],
                    },
                },
                sequelize: sequelize,
                modelName: 'User'
            }
        );
        User.beforeCreate(async (user, options) => {
            await user.hashPassword();
        });
        User.beforeUpdate(async (user, options) => {
            if (user.changed('Password')) {
                await user.hashPassword();
            }
        });
    };

    static privateFields = ['ID', 'Password', 'Suspicious', 'Naughty'];
    static privateExclPassFields = ['ID', 'Suspicious', 'Naughty'];
    static privateExclIDFields = ['Password', 'Suspicious', 'Naughty'];

    passwordValue() {
        return this.getDataValue('Password');
    }

    hashPassword = async() => {
        try {
            const userPassword = this.passwordValue();
            if (userPassword) {
                const hash = await bcrypt.hash(userPassword, saltRounds);
                user.Password = hash;
            }
        }
        catch (error) {
            logger.error(JSON.stringify(error, null, 4));
            throw error;
        }
    }

    checkPassword = async (password) => {
        const userPassword = this.passwordValue();
        const matchingNoPassword = !password && !this.passwordValue();

        if (!password
            && !matchingNoPassword) {
            return null;
        }

        var isValidPassword = matchingNoPassword;
        if (!isValidPassword) {
            isValidPassword = await bcrypt.compare(password, userPassword);
        }

        return isValidPassword;
    }

    // 'None', 'Disabled', 'Pending', 'Active'
    static statusTypes = Object.freeze({
        None: 0,
        Disabled: 1,
        Pending: 2,
        Active: 3,
    });

    // 'None', 'Down', 'Up', 'Manage'
    static accessLevels = Object.freeze({
        None: 0,
        Down: 1,
        Up: 2,
        Manage: 3,
    });

    static checkAccessLevel = (user, level, unless) => {
        if (!user) {
            let err = new Error(`User was null`);
            err.name = 'MissingUser';
            throw err;
        }
        if (User.accessLevels[user.Access] < User.accessLevels[level]) {
            if (!unless) {
                let err = new Error(`Insufficient user access`);
                err.name = 'InsufficientAccess';
                throw err;
            }
        }
        return true;
    }
    checkAccessLevel = (level, unless) => {
        return User.checkAccessLevel(this, level, unless)
    }

    static checkStatusType = (user, type, unless) => {
        if (!user) {
            let err = new Error(`User was null`);
            err.name = 'MissingUser';
            throw err;
        }
        if (User.statusTypes[user.Status] < User.statusTypes[type]) {
            if (!unless) {
                let err = new Error(`Invalid user status: ${user.Status}`);
                err.name = 'InvalidUserStatus';
                throw err;
            }
        }
        return true;
    }
    checkStatusType = (type, unless) => {
        return User.checkStatusType(type, unless)
    }
    
    static canManage = (user) => {
        try {
            User.checkAccessLevel(user, 'Manage');
            return true;
        }
        catch {
            return false;
        }
    } 

    canManage = () => {
        return User.canManage(this);
    }

    static forPublicScope = [
        'public',
        'isActive',
    ];

    static forPublicWithPasswordScope = [
        'publicWithPassword',
        'isActive',
    ];

    static forCreateScope = [
        'private',
    ];
}