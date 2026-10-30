const sequelize = require('./database');

module.exports = {
    User: require('./Models/User').User,
    Bones: require('./Models/Bones').Bones,
    Report: require('./Models/Report') .Report,
    BonesSpec: require('./Models/BonesSpec').BonesSpec,
    BonesStats: require('./Models/BonesStats').BonesStats,
    ModRecord: require('./Models/ModRecord').ModRecord,
    ModConfig: require('./Models/ModConfig').ModConfig,
};