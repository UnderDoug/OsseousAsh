const { Op } = require('sequelize');
const sequelize = require('./database');

const {
    User,
    Bones,
    Report,
    BonesSpec,
    BonesStats,
    ModRecord,
    ModConfig,
} = require('./models');

// one bones comes from a single user
// one user has multiple bones
User.Bones = User.hasMany(Bones, {
    foreignKey: 'UserID',
});
User.hasMany(Bones.scope({ method: ['ofUser', sequelize.col('ID')] }), {
    as: 'AllBones',
    where: {
        Status: 'Active',
    },
});
Bones.User = Bones.belongsTo(User);

// one report comes from a single user
// one user has multiple reports
User.Reports = User.hasMany(Report, {
    foreignKey: 'UserID',
});
User.hasMany(Report.scope({ method: ['ofUser', sequelize.col('ID')] }), {
    as: 'AllReports',
    where: {
        Status: 'Active',
    },
});
Report.User = Report.belongsTo(User);

// one report is for a single bones
// one bones has mutiple reports
Bones.Reports = Bones.hasMany(Report, {
    foreignKey: 'BonesID',
});
Bones.hasMany(Report.scope({ method: ['ofBones', sequelize.col('ID')] }), {
    as: 'AllReports',
    where: {
        SavGz: { [Op.is]: null },
    },
    foreignKey: 'BonesID', // this prevents 'BoneID' as a duplicate
});
Report.Bones = Report.belongsTo(Bones, {
    foreignKey: 'BonesID', // this prevents 'BoneID' as a duplicate
});

// one BonesSpec is for a single bones
// one bones has one BonesSpec
Bones.BonesSpec = Bones.hasOne(BonesSpec, {
    foreignKey: 'ID',
    where: {
        SavGz: { [Op.is]: null },
    },
    as: 'BonesSpec'
});
BonesSpec.Bones = BonesSpec.belongsTo(Bones, {
    foreignKey: 'ID', // this prevents 'BoneID' as a duplicate
});

// one BonesStats is for a single bones
// one bones has one BonesStats
Bones.Stats = Bones.hasOne(BonesStats, {
    foreignKey: 'ID',
    where: {
        SavGz: { [Op.is]: null },
    },
    as: 'Stats'
});
BonesStats.Bones = BonesStats.belongsTo(Bones, {
    foreignKey: 'ID', // this prevents 'BoneID' as a duplicate
});

// one ModConfig is for a single bones
// one bones has one ModConfig
Bones.ModConfig = Bones.hasOne(ModConfig, {
    foreignKey: 'ID',
    where: {
        SavGz: { [Op.is]: null },
    },
    as: 'ModConfig'
});
ModConfig.Bones = ModConfig.belongsTo(Bones, {
    foreignKey: 'ID', // this prevents 'BoneID' as a duplicate
});

// multiple ModConfigs have multiple ModRecords
const ModConfig_Record = sequelize.define('ModConfig_Record', {}, { timestamps: false, freezeTableName: true, });
ModConfig.belongsToMany(ModRecord, { through: ModConfig_Record });
ModRecord.belongsToMany(ModConfig, { through: ModConfig_Record });