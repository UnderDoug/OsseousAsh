const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');
const { DB_DIALECT } = process.env;

const isPostgres = DB_DIALECT == 'postgres';

module.exports.BonesStats = class BonesStats extends Model {
    static {
        BonesStats.init(
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
                LastEncountered: {
                    type: DataTypes.BIGINT,
                    autoIncrement: false,
                    allowNull: true,
                },
            },
            {
                defaultScope: {
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    include: [
                        {
                            association: 'Stats',
                            attributes: ['StatCategoryName'],
                            include: {
                                association: 'Entries',
                                attributes: ['UserID', 'Value'],
                            },
                        },
                    ],
                },
                scopes: {
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
                modelName: 'BonesStats',
            }
        );
    }

    getStatsDictionary(UserID) {
        const stats = this.get('Stats', { plain: true });
        const sanitizedIDMap = {};
        var statI = 0;
        return stats && stats.reduce((stats, stat, index) => {
            var entries = stat.Entries;
            if (UserID) {
                entries = stat.Entries.map(function (entry, index) {
                    var userID = entry.UserID;
                    if (userID != UserID) {
                        if (sanitizedIDMap[entry.UserID] == undefined) {
                            sanitizedIDMap[entry.UserID] = statI++;
                        }
                        userID = sanitizedIDMap[entry.UserID].toString()
                    }
                    return {
                        UserID: userID,
                        Value: entry.Value,
                    };
                });
            }
            stats[stat.StatCategoryName] = entries;
            return stats;
        }, {});
    }

    plainWithStatsDictionary(UserID) {
        return {
            ID: this.get('ID', { plain: true }),
            LastEncountered: this.get('LastEncountered', { plain: true }),
            Stats: this.getStatsDictionary(UserID),
        }
    }
}