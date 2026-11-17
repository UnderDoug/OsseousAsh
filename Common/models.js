const sequelize = require('./database');

module.exports = {
    User: require('./Models/User').User,
    Session: require('./Models/Session').Session,
    Bones: require('./Models/Bones').Bones,
    Report: require('./Models/Report') .Report,
    BonesSpec: require('./Models/BonesSpec').BonesSpec,
    BonesStats: require('./Models/BonesStats').BonesStats,
    StatCategory: require('./Models/StatCategory').StatCategory,
    BonesStatsCategory: require('./Models/BonesStatsCategory').BonesStatsCategory,
    BonesStatsCategoryEntry: require('./Models/BonesStatsCategoryEntry').BonesStatsCategoryEntry,
    ModConfig: require('./Models/ModConfig').ModConfig,
    ModRecord: require('./Models/ModRecord').ModRecord,
    ModConfigRecord: require('./Models/ModConfigRecord').ModConfigRecord,
};