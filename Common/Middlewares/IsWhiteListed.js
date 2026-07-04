if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const { logger } = require('../logger');
const WHITELIST = require('../../whitelist.json')
const { USER_ACTIVE_REQUIRED, USER_ACCESS_REQUIRED } = process.env;
const { tokenRecords } = require('./IsAllowedToPutSavGz');
const { Bones } = require('../Models/Bones');
const { User } = require('../Models/User');

const anyUserDetailsRequired = USER_ACTIVE_REQUIRED || USER_ACCESS_REQUIRED;

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
        const err = new Error(`Failed to check IP whitelist, ${error.message}`);
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
                logger.warn(errorMsg);
                return {
                    status: 401,
                    result: false,
                    error: errorMsg,
                }
            }
        }
        logger.info(`IP [${IP}] cleared whitelist`);
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

const tryGetIDFromParams = (req) => {
    try {
        if (req.params.OAID)
            return req.params.OAID;

        if (req.params.UserID)
            return req.params.UserID;

        return null;
    }
    catch (error) {
        logger.warn(`tryGetOAIDFromParams failed: ${error.message}`);
        return null;
    }
}

const tryGetIDFromSaveBonesJSON = async (req) => {
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
                    const bonesInfo = await Bones.findByPk(BonesID);
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
        logger.warn(`tryGetOAIDFromSaveBonesJSON failed: ${error.message}`);
        return null;
    }
}

const tryGetIDFromBody = (req) => {
    try {
        if (req.body.OsseousAshID)
            return req.body.OsseousAshID;

        return null;
    }
    catch (error) {
        logger.warn(`tryGetOAIDFromBody failed: ${error.message}`);
        return null;
    }
}

const checkID = async (req, res, next) => {
    try {
        if (WHITELIST.ID.length > 0
            || USER_ACTIVE_REQUIRED
            || USER_ACCESS_REQUIRED) {
            var iDCheck = {
                result: false,
                status: 401,
                error: 'Couldn\'t determine ID'
            };

            if (!iDCheck.result) {
                iDCheck = await performCheckID(tryGetIDFromParams(req));
            }
            if (!iDCheck.result) {
                iDCheck = await performCheckID(await tryGetIDFromSaveBonesJSON(req));
            }
            if (!iDCheck.result) {
                iDCheck = await performCheckID(tryGetIDFromBody(req));
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
        const err = new Error(`Failed to check ID whitelist, ${error.message}`);
        err.status = 500;
        next(err);
    }
}

const performCheckID = async (ID) => {
    try {
        try {
            var user = await User.findByPk(ID);

            if (!user) {
                if (anyUserDetailsRequired) {
                    return {
                        status: 204,
                        result: false,
                        error: {
                            message: `User [${ID}] not found`,
                            USER_ACTIVE_REQUIRED: USER_ACTIVE_REQUIRED,
                            USER_ACCESS_REQUIRED: USER_ACCESS_REQUIRED,
                        },
                    };
                }
                logger.warn(`User [${ID}] not found`);
            }
            else if (USER_ACTIVE_REQUIRED && user.Active != 'Active') {
                return {
                    status: 403,
                    result: false,
                    error: `User [${ID}] is not active and USER_ACTIVE_REQUIRED`,
                };
            }
            else if (USER_ACCESS_REQUIRED && user.Access == 'None') {
                return {
                    status: 403,
                    result: false,
                    error: `User [${ID}] has insufficient Access: '${user.Access}' and USER_ACCESS_REQUIRED`,
                };
            }
            else {
                logger.info(`User [${ID}] meets minimum requirements`);
                return {
                    status: 200,
                    result: true,
                }
            }
        }
        catch (error) {
            logger.warn(`Failed checking for User [${ID}]`);
        }

        if (WHITELIST.ID.length > 0) {
            var iDPassed = false;
            if (ID) {
                for (let i = 0; i < WHITELIST.ID.length; i++) {
                    if (WHITELIST.OsseousAshID[i] == ID)
                        iDPassed = true;
                }
            }
            if (!iDPassed) {
                var errorMsg = `ID [${ID}] not in whitelist`;
                logger.warn(errorMsg);
                return {
                    status: 403,
                    result: false,
                    error: errorMsg,
                }
            }
        }
        logger.warn(`ID [${ID}] cleared whitelist`);
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
            error: 'Couldn\'t determine ID'
        };

        var reqMethod = req.method; 
        var reqRoute = req.route;

        if (!iDCheck.result) {
            iDCheck = await performCheckID(tryGetIDFromParams(req));
        }
        if (!iDCheck.result
            && !reqRoute.path.startsWith('/v1/Bones/Download')) {
            iDCheck = await performCheckID(await tryGetIDFromSaveBonesJSON(req));
        }
        if (!iDCheck.result
            && !reqRoute.path.startsWith('/v1/Bones/Stats')) {
            iDCheck = await performCheckID(tryGetIDFromBody(req));
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
        const err = new Error(`Failed to check whitelist, ${error.message}`);
        err.status = 500;
        next(err);
    }
}

module.exports = {
    checkIP,
    checkID,
    check,
}