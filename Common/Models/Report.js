const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');

module.exports.Report = class Report extends Model {
    static {
        Report.init(
            {
                ID: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                Blocked: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    autoIncrement: false,
                    allowNull: false,
                },
                Type: {
                    type: DataTypes.ENUM('None', 'Offensive', 'Griefing', 'Broken', 'Other'),
                    allowNull: false,
                    autoIncrement: false,
                },
                ObjectDetails: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    autoIncrement: false,
                },
                Description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    autoIncrement: false,
                },
                Actioned: {
                    type: DataTypes.ENUM('None', 'Waiting', 'NonIssue', 'Deleted', 'Other'),
                    allowNull: false,
                    autoIncrement: false,
                }
            },
            {
                scopes: {
                    waiting: {
                        where: {
                            Actioned: 'Waiting',
                        },
                    },
                    ofUser(UserID) {
                        return {
                            where: {
                                UserID: { [Op.is]: UserID },
                            },
                        };
                    },
                    ofBones(BonesID) {
                        return {
                            where: {
                                BonesID: { [Op.is]: BonesID },
                                SavGz: { [Op.is]: null },
                            },
                        };
                    },
                },
                freezeTableName: true,
                sequelize: sequelize,
                modelName: 'Report'
            }
        );
    };
    isNaughty() {
        return this.getUser() && this.getUser().Naughty;
    }
}