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
                },
                Stats: {
                    type: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
                    autoIncrement: false,
                    allowNull: false,
                },
            },
            {
                sequelize: sequelize,
                freezeTableName: true,
                modelName: 'BonesStats',
            }
        );
    };
    getSanitizedStats = (UserID) => {
        var stats = null;
        Object.assign(stats, this.Stats);
        if (stats) {
            var statLabels = Object.keys(stats);
            for (let i = 0; i < statLabels.length; i++) {
                let stat = stats[statLabels[i]];
                let statI = 0;
                if (stat) {
                    if (!Array.isArray(stat)) {
                        continue;
                    }

                    for (let j = 0; j < stat.length; j++) {
                        if (!stat[j].UserID)
                            continue;

                        if (UserID
                            && stat[j].UserID == userID) {
                            continue;
                        }
                        stat[j].UserID = statI++;
                    }
                }
            }
        }
        return stats;
    }
}