const { Op } = require('sequelize');
const sequelize = require('./database');

const {
    User,
    Bones,
    Report,
    BonesSpec,
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
});
Report.Bones = Report.belongsTo(Bones, {
    foreignKey: 'BonesID', // this prevents 'BoneID' as a duplicate
});

// one BonesSpec is for a single bones
// one bones has one BonesSpec
Bones.BonesSpec = Bones.hasOne(BonesSpec, {
    foreignKey: 'BonesID',
    where: {
        SavGz: { [Op.is]: null },
    },
});
BonesSpec.Bones = BonesSpec.belongsTo(Bones, {
    foreignKey: 'BonesID', // this prevents 'BoneID' as a duplicate
    as: 'Bones'
});