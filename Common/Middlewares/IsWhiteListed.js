const sequelize = require('../database');
const WHITELIST = require('../../whitelist.json')
const defineBonesInfo = require('../Models/Bones');
const BonesInfo = defineBonesInfo(sequelize);
const { tokenRecords } = require('./IsAllowedToPutSavGz');

const check = async (req, res, next) => {
    try {

        const reqIP = req.socket.remoteAddress;

        if (WHITELIST.IP.length > 0) {
            var iPPassed = false;
            for (let i = 0; i < WHITELIST.IP.length; i++) {
                if (WHITELIST.IP[i] == reqIP)
                    iPPassed = true;
            }
            if (!iPPassed) {
                var errorMsg = `IP [${reqIP}] not in whitelist`;
                console.log(errorMsg);
                return res.status(403).json({
                    error: errorMsg
                });
            }
        }

        var {
            BonesID,
            SaveBonesJSON
        } = req.body;

        if (req.token) {
            const tokenRecord = tokenRecords[req.token];
            if (tokenRecord) {
                BonesID = tokenRecord.BonesID;
                console.log(BonesID);
                if (BonesID) {
                    const bonesInfo = await BonesInfo.findByPk(BonesID);
                    if (bonesInfo
                        && bonesInfo.SaveBonesJSON) {
                        SaveBonesJSON = bonesInfo.SaveBonesJSON;
                    }
                }
            }
        }

        const osseousAshID = SaveBonesJSON?.OsseousAshID;

        if (WHITELIST.OsseousAshID.length > 0) {
            var iDPassed = false;
            if (osseousAshID) {
                for (let i = 0; i < WHITELIST.OsseousAshID.length; i++) {
                    if (WHITELIST.OsseousAshID[i] == osseousAshID)
                        iDPassed = true;
                }
            }
            if (!iDPassed) {
                var errorMsg = `OsseousAshID [${osseousAshID}] not in whitelist`;
                console.log(errorMsg);
                return res.status(403).json({
                    error: errorMsg
                });
            }
        }
        console.log(`OsseousAshID [${osseousAshID}] and IP [${reqIP}] cleared whitelist`);
        next();
    }
    catch (error) {
        var errorMsg = `Failed to check whitelist, ${error.message}`;
        console.log(errorMsg);
        const err = new Error(errorMsg);
        err.status = 500;
        next(err);
    }
}

module.exports = {
    check,
}