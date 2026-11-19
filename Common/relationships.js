const { Op } = require('sequelize');
const sequelize = require('./database');
const queryInterface = sequelize.getQueryInterface();
const { logger } = require('./logger');

const {
    User,
    Session,
    Bones,
    Report,
    BonesSpec,
    BonesStats,
    StatCategory,
    BonesStatsCategory,
    BonesStatsCategoryEntry,
    ModConfig,
    ModRecord,
    ModConfigRecord,
} = require('./models');

// a User has many Sessions
// a Session comes from a single User 
User.Sessions = User.hasMany(Session, {// source: User, target: Session
    as: 'Sessions',
    onDelete: 'cascade',

    // matches Session.UserID
    foreignKey: { // on Session
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    sourceKey: 'ID',
});
Session.User = Session.belongsTo(User, { // source: Session, target: User
    as: 'User',

    // matches Session.UserID
    foreignKey: { // on Session
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    targetKey: 'ID',
});
Session.hasOne(User, { // source: Session, target: User
    // matches User.ID
    foreignKey: 'ID', // on User

    // refs Session.UserID
    sourceKey: 'UserID',
});

// a Bones comes from a single User
// a User has multiple Bones
User.Bones = User.hasMany(Bones.unscoped(), { // source: User, target: Bones
    as: 'Bones',
    onDelete: 'cascade',

    // matches Bones.UserID
    foreignKey: { // on bones
        name: 'UserID',
        // allowNull: false,
    },

    // refs User.ID
    sourceKey: 'ID',
});
Bones.User = Bones.belongsTo(User, { // source: Bones, target: User
    as: 'User',
    where: {
        Status: 'Active',
    },

    // matches Bones.UserID
    foreignKey: { // on Bones
        name: 'UserID',
        // allowNull: false,
    },

    // refs User.ID
    targetKey: 'ID',
});

// a Report comes from a single User
// a User has multiple Reports
User.Reports = User.hasMany(Report, { // source: User, target: Report
    as: 'Reports',
    onDelete: 'cascade',

    // matches Report.UserID
    foreignKey: { // on Report
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    sourceKey: 'ID',
});
User.ActiveReports = User.hasMany(Report.scope({ method: ['ofUser', sequelize.col('ID')] }), { // source: User, target: Report
    as: 'ActiveReports',
    where: {
        Status: 'Active',
    },

    // matches Report.UserID
    foreignKey: { // on Report
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    sourceKey: 'ID',
});
Report.User = Report.belongsTo(User.unscoped(), { // source: Report, target: User
    as: 'User',

    // matches Report.UserID
    foreignKey: {
        name: 'UserID', // on Report
        allowNull: false,
    },

    // refs User.ID
    targetKey: 'ID',
});
Report.hasOne(User.unscoped(), { // source: Report, target: User
    // matches User.ID
    foreignKey: { // on User
        name: 'ID',
        allowNull: false,
    },

    // refs Report.UserID
    sourceKey: 'UserID',
});

// a Report is for a single Bones
// a Bones has mutiple Reports
Bones.Reports = Bones.hasMany(Report.scope({ method: ['ofBones', sequelize.col('ID')] }), { // source: Bones, target: Report
    as: 'Reports',
    onDelete: 'cascade',

    // matches Report.BonesID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on Report
        name: 'BonesID',
        allowNull: false,
    },

    // refs Bones.ID
    sourceKey: 'ID',
});
Report.Bones = Report.belongsTo(Bones.unscoped(), { // source: Report, target: Bones
    as: 'Bones',

    // matches Report.BonesID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on Report
        name: 'BonesID',
        allowNull: false,
    },

    // refs Bones.ID
    targetKey: 'ID', 
});
Report.hasOne(Bones.unscoped(), { // source: Report, target: Bones
    // matches Bones.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on Bones
        name: 'ID',
        allowNull: false,
    },

    // refs Report.BonesID
    sourceKey: 'BonesID',
});

// a BonesSpec is for a single Bones
// a Bones has one BonesSpec
Bones.BonesSpec = Bones.hasOne(BonesSpec, { // source: Bones, target: BonesSpec
    as: 'BonesSpec',
    onDelete: 'cascade',

    // matches BonesSpec.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on BonesSpec
        name: 'ID',
        allowNull: false,
    },

    // refs Bones.ID
    sourceKey: 'ID',
});
BonesSpec.Bones = BonesSpec.belongsTo(Bones.unscoped(), { // source: BonesSpec, target: Bones
    as: 'Bones',
    constraints: false,

    // matches BonesSpec.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on BonesSpec
        name: 'ID',
        allowNull: false,
    },

    // refs Bones.ID
    targetKey: 'ID',
});
BonesSpec.hasOne(Bones.unscoped(), { // source: BonesSpec, target: Bones
    // matches Bones.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on Bones
        name: 'ID',
        allowNull: false,
    },

    // refs BonesSpec.ID
    sourceKey: 'ID',
});

// a BonesStats is for a single Bones
// a Bones has one BonesStats
Bones.BonesStats = Bones.hasOne(BonesStats, { // source: Bones, target: BonesStats
    as: 'BonesStats',
    onDelete: 'cascade',

    // matches BonesStats.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on BonesStats
        name: 'ID',
        allowNull: false,
    }, 

    // refs Bones.ID
    sourceKey: 'ID',
});
BonesStats.Bones = BonesStats.belongsTo(Bones.unscoped(), { // source: BonesStats, target: Bones
    as: 'Bones',
    constraints: false,

    // matches BonesStats.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on BonesStats
        name: 'ID',
        allowNull: false,
    },

    // refs Bones.ID
    targetKey: 'ID',
});
BonesStats.hasOne(Bones.unscoped(), { // source: BonesStats, target: Bones
    // matches Bones.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on Bones
        name: 'ID',
        allowNull: false,
    },

    // refs BonesStats.ID
    sourceKey: 'ID',
});

// a ModConfig is for a single Bones
// a Bones has one ModConfig
Bones.ModConfig = Bones.hasOne(ModConfig, { // source: Bones, target: ModConfig
    as: 'ModConfig',
    onDelete: 'cascade',
    constraints: false,

    // matches ModConfig.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on ModConfig
        name: 'ID',
        allowNull: false,
    },

    // refs Bones.ID
    sourceKey: 'ID',
});
ModConfig.Bones = ModConfig.belongsTo(Bones.unscoped(), { // source: ModConfig, target: Bones
    as: 'Bones',

    // matches ModConfig.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on ModConfig
        name: 'ID',
        allowNull: false,
    },

    // refs Bones.ID
    targetKey: 'ID',
});
ModConfig.hasOne(Bones.unscoped(), { // source: ModConfig, target: Bones
    // matches Bones.ID; this prevents 'BoneID' as a duplicate
    foreignKey: { // on Bones
        name: 'ID',
        allowNull: false,
    },

    // refs ModConfig.ID
    sourceKey: 'ID',
});

// a BonesStats has multiple StatCategory
// a StatCategory is for multiple BonesStats
BonesStats.belongsToMany(StatCategory, { // source: BonesStats, target: StatCategory, via: BonesStatsCategory
    as: 'Category',
    through: BonesStatsCategory,

    // matches BonesStatsCategory.BonesStatsID
    foreignKey: { // on BonesStatsCategory
        name: 'BonesStatsID',
        allowNull: false,
    },

    // refs StatCategory.Name
    targetKey: 'Name',

    // refs BonesStats.ID
    sourceKey: 'ID',
});
StatCategory.belongsToMany(BonesStats, { // source: StatCategory, target: BonesStats, via: BonesStatsCategory
    through: BonesStatsCategory,

    // matches BonesStatsCategory.BonesStatsID
    foreignKey: { // on BonesStatsCategory
        name: 'StatCategoryName',
        allowNull: false,
    },

    // refs BonesStats.ID
    targetKey: 'ID',

    // refs StatCategory.Name
    sourceKey: 'Name',
});

BonesStats.hasMany(BonesStatsCategory, { // source: BonesStats, target: BonesStatsCategory
    as: {
        singular: 'Stat',
        plural: 'Stats',
    },
    onDelete: 'cascade',

    // matches BonesStatsCategory.BonesStatsID
    foreignKey: { // on BonesStatsCategory
        name: 'BonesStatsID',
        allowNull: false,
    },

    // refs BonesStats.ID
    targetKey: 'ID',
});
BonesStatsCategory.BonesStats = BonesStatsCategory.belongsTo(BonesStats, { // source: BonesStatsCategory, target: BonesStats
    as: 'BonesStats',

    // matches BonesStatsCategory.BonesStatsID
    foreignKey: { // on BonesStatsCategory
        name: 'BonesStatsID',
        allowNull: false,
    },

    // refs BonesStats.ID
    targetKey: 'ID',
});
BonesStatsCategory.hasOne(BonesStats, { // source: BonesStatsCategory, target: BonesStats
    // matches BonesStats.ID
    foreignKey: { // on BonesStats
        name: 'ID',
        allowNull: false,
    },

    // refs BonesStatsCategory.BonesStatsID
    sourceKey: 'BonesStatsID',
});

StatCategory.hasMany(BonesStatsCategory, { // source: StatCategory, target: BonesStatsCategory
    onDelete: 'cascade',
    // matches BonesStatsCategory.StatCategoryName
    foreignKey: { // on BonesStatsCategory
        name: 'StatCategoryName',
        allowNull: false,
    },

    // refs StatCategory.Name
    targetKey: 'Name',
});
BonesStatsCategory.Category = BonesStatsCategory.belongsTo(StatCategory, { // source: BonesStatsCategory, target: StatCategory
    as: 'Category',

    // matches BonesStatsCategory.StatCategoryName
    foreignKey: { // on BonesStatsCategory
        name: 'StatCategoryName',
        allowNull: false,
    },

    // refs StatCategory.Name
    targetKey: 'Name',
});
BonesStatsCategory.hasOne(StatCategory, { // source: BonesStatsCategory, target: StatCategory
    // matches StatCategory.Name
    foreignKey: { // on StatCategory
        name: 'Name',
        allowNull: false,
    },

    // refs BonesStatsCategory.StatCategoryName
    sourceKey: 'StatCategoryName',
});

// a BonesStatsCategory has multiple Users
// a User is for multiple BonesStatsCategory
BonesStatsCategory.Users = BonesStatsCategory.belongsToMany(User, { // source: BonesStatsCategory, target: User, via: BonesStatsCategoryEntry
    as: {
        singular: 'User',
        plural: 'Users',
    },
    through: BonesStatsCategoryEntry,

    // matches BonesStatsCategoryEntry.BonesStatsCategoryID
    foreignKey: { // on BonesStatsCategoryEntry
        name: 'BonesStatsCategoryID',
        allowNull: false,
    },

    // refs BonesStatsCategory.ID
    sourceKey: 'ID',
});
User.belongsToMany(BonesStatsCategory, { // source: User, target: BonesStatsCategory, via: BonesStatsCategoryEntry
    through: BonesStatsCategoryEntry,

    // matches BonesStatsCategoryEntry.UserID
    foreignKey: { // on BonesStatsCategoryEntry
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    sourceKey: 'ID',
});

BonesStatsCategory.Entries = BonesStatsCategory.hasMany(BonesStatsCategoryEntry, { // source: BonesStatsCategory, target: BonesStatsCategoryEntry
    as: {
        singular: 'Entry',
        plural: 'Entries',
    },
    onDelete: 'cascade',

    // matches BonesStatsCategoryEntry.BonesStatsCategoryID
    foreignKey: { // on BonesStatsCategoryEntry
        name: 'BonesStatsCategoryID',
        allowNull: false,
    },

    // refs BonesStatsCategory.ID
    sourceKey: 'ID',
});
BonesStatsCategoryEntry.Stat = BonesStatsCategoryEntry.belongsTo(BonesStatsCategory, { // source: BonesStatsCategoryEntry, target: BonesStatsCategory
    as: 'Stat',

    // matches BonesStatsCategoryEntry.BonesStatsCategoryID
    foreignKey: { // on BonesStatsCategoryEntry
        name: 'BonesStatsCategoryID',
        allowNull: false,
    },

    // refs BonesStatsCategory.ID
    targetKey: 'ID',
});
BonesStatsCategoryEntry.hasOne(BonesStatsCategory, { // source: BonesStatsCategoryEntry, target: BonesStatsCategory
    // matches BonesStatsCategoryEntry.BonesStatsCategoryID
    foreignKey: { // on BonesStatsCategory
        name: 'ID',
        allowNull: false,
    },

    // refs BonesStatsCategoryEntry.BonesStatsCategoryID
    sourceKey: 'BonesStatsCategoryID',
});

User.hasMany(BonesStatsCategoryEntry, { // source: User, target: BonesStatsCategoryEntry
    // matches BonesStatsCategoryEntry.UserID
    foreignKey: { // on BonesStatsCategoryEntry
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    sourceKey: 'ID',
});
BonesStatsCategoryEntry.User = BonesStatsCategoryEntry.belongsTo(User, { // source: BonesStatsCategoryEntry, target: User
    as: 'User',

    // matches BonesStatsCategoryEntry.UserID
    foreignKey: { // on BonesStatsCategoryEntry
        name: 'UserID',
        allowNull: false,
    },

    // refs User.ID
    targetKey: 'ID',
});
BonesStatsCategoryEntry.hasOne(User, { // source: BonesStatsCategoryEntry, target: User
    // matches BonesStatsCategoryEntry.UserID
    foreignKey: { // on User
        name: 'ID',
        allowNull: false,
    },

    // refs BonesStatsCategoryEntry.UserID
    sourceKey: 'UserID',
});

// a ModConfig has multiple ModRecords
// a ModRecord is for multiple ModConfigs
ModConfig.Records = ModConfig.belongsToMany(ModRecord, { // source: ModConfig, target: ModRecord, via: ModConfigRecord
    as: {
        singular: 'Record',
        plural: 'Records',
    },
    through: ModConfigRecord,

    // matches ModConfigRecord.ModConfigID
    foreignKey: { // on ModConfigRecord
        name: 'ModConfigID',
        allowNull: false,
    },

    // refs ModConfig.ID
    sourceKey: 'ID', 

    // refs ModRecord.Index
    targetKey: 'Index', 
});
ModRecord.belongsToMany(ModConfig, { // source: ModRecord, target: ModConfig, via: ModConfigRecord
    through: ModConfigRecord,

    // matches ModConfigRecord.ModRecordIndex
    foreignKey: {
        name: 'ModRecordIndex', // on ModConfigRecord
        allowNull: false,
    },

    // refs ModRecord.Index
    sourceKey: 'Index',    

    // refs ModConfig.ID
    targetKey: 'ID',
});

ModConfig.hasMany(ModConfigRecord, { // source: ModConfig, target: ModConfigRecord
    onDelete: 'cascade',

    // matches ModConfigRecord.ModConfigID
    foreignKey: { // on ModConfigRecord
        name: 'ModConfigID',
        allowNull: false,
    },

    // refs ModConfig.ID
    sourceKey: 'ID',
});
ModConfigRecord.ModConfig = ModConfigRecord.belongsTo(ModConfig, { // source: ModConfigRecord, target: ModConfig
    as: 'ModConfig',

    // matches ModConfigRecord.ModConfigID
    foreignKey: { // on ModConfigRecord
        name: 'ModConfigID',
        allowNull: false,
    },

    // refs ModConfig.ID
    targetKey: 'ID',
});
ModConfigRecord.hasOne(ModConfig, { // source: ModConfigRecord, target: ModConfig
    // matches ModConfigRecord.ModConfigID
    foreignKey: 'ID', // on ModConfig

    // refs ModConfig.ID
    sourceKey: 'ModConfigID',
});

ModRecord.hasMany(ModConfigRecord, { // source: ModRecord, target: ModConfigRecord
    onDelete: 'cascade',
    // matches ModConfigRecord.ModRecordIndex
    foreignKey: { // on ModConfigRecord
        name: 'ModRecordIndex',
        allowNull: false,
    },

    // refs ModRecord.Index
    sourceKey: 'Index',
});
ModConfigRecord.Record = ModConfigRecord.belongsTo(ModRecord, { // source: ModConfigRecord, target: ModRecord
    as: 'Record',

    // matches ModConfigRecord.ModRecordIndex
    foreignKey: { // on ModConfigRecord
        name: 'ModRecordIndex',
        allowNull: false,
    },

    // refs ModRecord.Index
    targetKey: 'Index',
});
ModConfigRecord.hasOne(ModRecord, { // source: ModConfigRecord, target: ModRecord
    // matches ModConfigRecord.ModRecordIndex
    foreignKey: { // on ModRecord
        name: 'Index',
        allowNull: false,
    },

    // refs ModRecord.Index
    sourceKey: 'ModRecordIndex',
});

module.exports.setUpMissingConstraints = async (queryInterface) => {
    const foreignKeysForTables = await queryInterface.getForeignKeysForTables(['BonesSpec', 'BonesStats', 'ModConfig']);
    logger.info(JSON.stringify({ ForeignKeys: foreignKeysForTables }, null, 4));
    const addConstraintTasks = [];
    // BonesSpec
    try {
        let foreignKeysForTable = foreignKeysForTables.BonesSpec;
        if (!foreignKeysForTable.includes('BonesSpec_Bones_fkey')) {
            addConstraintTasks.push([
                'BonesSpec',
                queryInterface.addConstraint('BonesSpec', {
                    fields: ['ID'],
                    type: 'foreign key',
                    name: 'BonesSpec_Bones_fkey',
                    references: { //Required field
                        table: 'Bones',
                        field: 'ID'
                    },
                    onDelete: 'cascade',
                    onUpdate: 'cascade'
                })
            ]);
        }
    }
    catch (err) {
        logger.warn(`Unable to add BonesSpec pkey/fkey constraints (inner): ${JSON.stringify(err, null, 4)}`);
    }

    // BonesStats
    try {
        let foreignKeysForTable = foreignKeysForTables.BonesStats;
        if (!foreignKeysForTable.includes('BonesStats_Bones_fkey')) {
            addConstraintTasks.push([
                'BonesStats',
                queryInterface.addConstraint('BonesStats', {
                    fields: ['ID'],
                    type: 'foreign key',
                    name: 'BonesStats_Bones_fkey',
                    references: { //Required field
                        table: 'Bones',
                        field: 'ID'
                    },
                    onDelete: 'cascade',
                    onUpdate: 'cascade'
                })
            ]);
        }
    }
    catch (err) {
        logger.warn(`Unable to add BonesStats pkey/fkey constraints (inner): ${JSON.stringify(err, null, 4)}`);
    }

    // ModConfig
    try {
        let foreignKeysForTable = foreignKeysForTables.ModConfig;
        if (!foreignKeysForTable.includes('ModConfig_Bones_fkey')) {
            addConstraintTasks.push([
                'ModConfig',
                queryInterface.addConstraint('ModConfig', {
                    fields: ['ID'],
                    type: 'foreign key',
                    name: 'ModConfig_Bones_fkey',
                    references: { //Required field
                        table: 'Bones',
                        field: 'ID'
                    },
                    onDelete: 'cascade',
                    onUpdate: 'cascade'
                })
            ]);
        }
    }
    catch (err) {
        logger.warn(`Unable to add ModConfig pkey/fkey constraints (inner): ${JSON.stringify(err, null, 4)}`);
    }

    for (let i = 0; i < addConstraintTasks.length; i++) {
        let [label, task] = addConstraintTasks[i];
        try {
            await task;
        }
        catch (err) {
            logger.warn(`Failed to await addConstraintTasks['${label}']: ${JSON.stringify(err, null, 4)}`);
        }
    }
}