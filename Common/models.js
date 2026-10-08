const sequelize = require('./database');

const { User } = require('./Models/User');
const { Bones } = require('./Models/Bones');
const { Report } = require('./Models/Report');
const { BonesSpec } = require('./Models/BonesSpec');

module.exports = {
    User: User,
    Bones: Bones,
    Report: Report,
    BonesSpec: BonesSpec,
};