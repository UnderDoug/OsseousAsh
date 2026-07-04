const sequelize = require('./database');

const {
    User,
    Bones,
    Report,
} = require('./models');

// one bones comes from a single user
// one user has multiple bones
User.hasMany(Bones, {
    foreignKey: 'UserID',
});
User.hasMany(Bones.scope({ method: ['ofUser', sequelize.col('ID')] }), {
    as: 'AllBones',
    where: {
        Status: 'Active',
    },
});
Bones.belongsTo(User);

// one report comes from a single user
// one user has multiple reports
User.hasMany(Report, {
    foreignKey: 'UserID',
});
User.hasMany(Report.scope({ method: ['ofUser', sequelize.col('ID')] }), {
    as: 'AllReports',
    where: {
        Status: 'Active',
    },
});
Report.belongsTo(User);

// one report is for a single bones
// one bones has mutiple reports
Bones.hasMany(Report, {
    foreignKey: 'BonesID',
});
Report.belongsTo(Bones, {
    foreignKey: 'BonesID', // this prevents 'BoneID' as a duplicate
});