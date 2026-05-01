const sequelize = require('../database');
const WHITELIST = require('../../whitelist.json')
const defineBonesInfo = require('../Models/Bones');
const BonesInfo = defineBonesInfo(sequelize);
const { tokenRecords } = require('./IsAllowedToPutSavGz');

const checkIP = async (req, res, next) => {
    try {
        const reqIP = req.socket.remoteAddress;

        const iPCheck = performCheckIP(reqIP);

        if (iPCheck.result) {
            if (iPCheck.status == 200) {
                next();
                return;
            }
        }
        if (iPCheck.status != 500) {
            return res.status(iPCheck.status).json({
                error: iPCheck.error
            });
        }
        next(iPCheck.error);
    }
    catch (error) {
        var errorMsg = `Failed to check IP whitelist, ${error.message}`;
        console.log(errorMsg);
        const err = new Error(errorMsg);
        err.status = 500;
        next(err);
    }
}

const performCheckIP = (IP) => {
    try {
        if (WHITELIST.IP.length > 0) {
            var iPPassed = false;
            for (let i = 0; i < WHITELIST.IP.length; i++) {
                if (WHITELIST.IP[i] == IP)
                    iPPassed = true;
            }
            if (!iPPassed) {
                var errorMsg = `IP [${IP}] not in whitelist`;
                console.log(errorMsg);
                return {
                    status: 403,
                    result: false,
                    error: errorMsg,
                }
            }
        }
        console.log(`IP [${IP}] cleared whitelist`);
        return {
            status: 200,
            result: true,
        }
    }
    catch (error) {
        return {
            status: 500,
            result: false,
            error: error,
        }
    }
}

const tryGetOAIDFromParams = (req) => {
    try {
        if (req.params.OAID)
            return req.params.OAID;

        return null;
    }
    catch (error) {
        console.log('tryGetOAIDFromParams failed:', error.message);
        return null;
    }
}

const tryGetOAIDFromSaveBonesJSON = async (req) => {
    try {
        var {
            BonesID,
            SaveBonesJSON
        } = req.body;

        if (req.token) {
            const tokenRecord = tokenRecords[req.token];
            if (tokenRecord) {
                BonesID = tokenRecord.BonesID;
                if (BonesID) {
                    const bonesInfo = await BonesInfo.findByPk(BonesID);
                    if (bonesInfo
                        && bonesInfo.SaveBonesJSON) {
                        SaveBonesJSON = bonesInfo.SaveBonesJSON;
                    }
                }
            }
        }
        if (SaveBonesJSON?.OsseousAshID)
            return SaveBonesJSON.OsseousAshID;

        return null;
    }
    catch (error) {
        console.log('tryGetOAIDFromSaveBonesJSON failed:', error.message);
        return null;
    }
}

const tryGetOAIDFromBody = (req) => {
    try {
        if (req.body.OsseousAshID)
            return req.body.OsseousAshID;

        return null;
    }
    catch (error) {
        console.log('tryGetOAIDFromBody failed:', error.message);
        return null;
    }
}

const checkOAID = async (req, res, next) => {
    try {
        if (WHITELIST.OsseousAshID.length > 0) {
            var iDCheck = {
                result: false,
                status: 403,
                error: 'Couldn\'t determine OsseousAshID'
            };

            if (!iDCheck.result) {
                iDCheck = performCheckOAID(tryGetOAIDFromParams(req));
            }
            if (!iDCheck.result) {
                iDCheck = performCheckOAID(await tryGetOAIDFromSaveBonesJSON(req));
            }
            if (!iDCheck.result) {
                iDCheck = performCheckOAID(tryGetOAIDFromBody(req));
            }

            if (iDCheck.result) {
                if (iDCheck.status == 200) {
                    next();
                    return;
                }
            }
            if (iDCheck.status != 500) {
                return res.status(iDCheck.status).json({
                    error: iDCheck.error
                });
            }
            next(iDCheck.error);
        }
    }
    catch (error) {
        var errorMsg = `Failed to check OAID whitelist, ${error.message}`;
        console.log(errorMsg);
        const err = new Error(errorMsg);
        err.status = 500;
        next(err);
    }
}

const performCheckOAID = (osseousAshID) => {
    try {
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
                return {
                    status: 403,
                    result: false,
                    error: errorMsg,
                }
            }
        }
        console.log(`OsseousAshID [${osseousAshID}] cleared whitelist`);
        return {
            status: 200,
            result: true,
        }
    }
    catch (error) {
        return {
            status: 500,
            result: false,
            error: error,
        }
    }
}

const check = async (req, res, next) => {
    try {
        const reqIP = req.socket.remoteAddress;

        const iPCheck = performCheckIP(reqIP);

        if (!iPCheck.result
            || iPCheck.status != 200) {
            if (iPCheck.status != 500) {
                return res.status(iPCheck.status).json({
                    error: iPCheck.error
                });
            }
            next(iPCheck.error);
            return;
        }

        var iDCheck = {
            result: false,
            status: 403,
            error: 'Couldn\'t determine OsseousAshID'
        };

        var reqMethod = req.method; 
        var reqRoute = req.route; 
        if (!iDCheck.result) {
            iDCheck = performCheckOAID(tryGetOAIDFromParams(req));
        }
        if (!iDCheck.result) {
            iDCheck = performCheckOAID(await tryGetOAIDFromSaveBonesJSON(req));
        }
        if (!iDCheck.result
            && !reqRoute.path.startsWith('/Bones/Stats')) {
            iDCheck = performCheckOAID(tryGetOAIDFromBody(req));
        }

        if (!iDCheck.result
            || iDCheck.status != 200) {
            if (iDCheck.status != 500) {
                return res.status(iDCheck.status).json({
                    error: iDCheck.error
                });
            }
            next(iDCheck.error);
            return;
        }

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
    checkIP,
    checkOAID,
    check,
}