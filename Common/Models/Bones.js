const { logger } = require('../logger');
const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { DB_DIALECT } = process.env;

const isPostgres = DB_DIALECT == 'postgres';
const savGZDataType = isPostgres
    ? DataTypes.BLOB
    : DataTypes.BLOB('medium')
    ;

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
                SavGz: {
                    type: savGZDataType,
                    allowNull: true,
                    autoIncrement: false,
                },
                Size: {
                    type: new DataTypes.VIRTUAL(savGZDataType, ['SavGz']),
                    get() {
                        try {
                            let savGz = this.getDataValue('SavGz');
                            if (savGz) {
                                return Uint8Array.from(savGz).byteLength;
                            }
                            logger.warn(`Bones.Size retrieved null SavGz`);
                        }
                        catch (err) {
                            logger.error(`retrieving Bones.Size:${err.message}`);
                        }
                        return 0;
                    }
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
                    withData: {
                        where: {
                            SavGz: { [Op.not]: null },
                        },
                    },
                    bonesSpec: {
                        include: [
                            {
                                association: 'BonesSpec',
                                // required: true,
                            },
                        ],
                    },
                    bonesStats: {
                        include: [
                            {
                                association: 'BonesStats',
                                include: [
                                    {
                                        association: 'Stats',
                                        include: {
                                            association: 'Entries',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    bonesStatsClean: {
                        include: [
                            {
                                association: 'BonesStats',
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
                        ],
                    },
                    modConfig: {
                        include: [
                            {
                                association: 'ModConfig',
                                include: [{
                                    association: 'Records',
                                    attributes: ['Index', 'ID', 'Version', 'Title'],
                                    through: {
                                        attributes: [],
                                    },
                                }],
                            },
                        ],
                    },
                    modConfigClean: {
                        include: [
                            {
                                association: 'ModConfig',
                                // required: true,
                                include: [{
                                    association: 'Records',
                                    attributes: ['ID', 'Version', 'Title'],
                                    through: {
                                        attributes: [],
                                    },
                                }],
                            },
                        ],
                    },
                    ofUser(UserID) {
                        return {
                            where: {
                                UserID: { [Op.is]: UserID },
                                SavGz: { [Op.not]: null },
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
    };

    static forCreateScope = [
        'bonesSpec',
        'bonesStats',
        'modConfig',
    ];

    static forCreateCleanScope = [
        'bonesSpec',
        'bonesStatsClean',
        'modConfigClean',
    ];

    static forOutputScope = [
        'withData',
        'bonesSpec',
        'bonesStats',
        'modConfig',
    ];

    static forOutputCleanScope = [
        'withData',
        'bonesSpec',
        'bonesStatsClean',
        'modConfigClean',
    ];

    static forOutputInclude = [
        {
            association: 'BonesSpec',
        },
        {
            association: 'BonesStats',
            include: [
                {
                    association: 'Stats',
                    include: {
                        association: 'Entries',
                    },
                },
            ],
        },
        {
            association: 'ModConfig',
            include: [{
                association: 'Records',
                attributes: ['Index', 'ID', 'Version', 'Title'],
                through: {
                    attributes: [],
                },
            }],
        },
    ];

    static forOutputCleanInclude = [
        {
            association: 'BonesSpec',
        },
        {
            association: 'BonesStats',
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
        {
            association: 'ModConfig',
            include: [{
                association: 'Records',
                attributes: ['ID', 'Version', 'Title'],
                through: {
                    attributes: [],
                },
            }],
        },
    ];
}