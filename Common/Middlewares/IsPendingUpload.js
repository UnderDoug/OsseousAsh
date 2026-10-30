const { logger } = require('../logger');
const { Op } = require('sequelize');
const { Bones } = require('../Models/Bones');

module.exports.uploadTokenDuration = 180000; // 3 minutes in ms

module.exports.uploadTokenRecords = {};

module.exports.clearUploadToken = (token, doClearTimeout = true) => {
    try {
        var tokenRecord = tokenRecords[token];
        if (tokenRecord) {
            if (tokenRecord.BonesID) {
                tokenRecord.BonesID = null;
            }
            if (tokenRecord.TimeStamp) {
                tokenRecord.TimeStamp = null;
            }
            if (tokenRecord.Timer) {
                if (doClearTimeout) {
                    clearTimeout(tokenRecord.Timer);
                }
                tokenRecord.Timer = null;
            }
            tokenRecords[token] = null;
        }
    }
    catch (error) {
        logger.error(`Failed to clear token: ${token}, ${error.message}`);
    }
}

module.exports.produceUploadToken = (BonesID) => {
    try {
        var token = crypto.randomUUID();
        tokenRecords[token] = {
            BonesID: BonesID,
            TimeStamp: Date.now(),
            Timer: setTimeout(async () => {
                let tokenString = token ?? 'NO_TOKEN';
                logger.log(`Expired token ${tokenString}; deleting dataless Bones: ${BonesID}`);
                try {
                    await Bones.destroy({
                        where: {
                            ID: BonesID,
                            SavGz: { [Op.is]: null },
                        }
                    });
                }
                catch (error) {
                    let bonesID = BonesID ?? 'NO_BONES_ID';
                    logger.error(`Error deleting Bones ${tokenString}; deleting dataless Bones: ${bonesID}, ${error.message}`);
                }

                clearToken(token, false);
            }, tokenDuration),
        };
        return token;
    }
    catch (error) {
        let tokenString = token ?? 'NO_TOKEN';
        logger.error(`Failed to create token: ${tokenString}, ${error.message}`);
    }
}

module.exports.assignUploadToken = (req, res, next) => {
    try {
        req.basicToken = getToken(req.body.BonesID);
        logger.log('BonesID:', req.body.BonesID, 'token:', req.basicToken);
        next();
    }
    catch (error) {
        logger.error('Failed to create token for follow up SavGz PUT');
        const err = new Error(`Failed to create token for follow up SavGz PUT, ${error.message}`);
        err.status = 500;
        next(err);
    }
}

module.exports.checkUploadAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        logger.log('No authorization header provided');
        return res.status(401).json({
            error: 'No authorization header provided'
        });
    }

    const [type, token] = authHeader.split(' ');
    if (type != 'basic') {
        logger.error('Authorization token missing');
        return res.status(401).json({
            error: 'Authorization token missing'
        });
    }

    var tokenRecord = tokenRecords[token];
    if (!tokenRecord) {
        logger.error('Authorization token missing');
        return res.status(401).json({
            error: 'Authorization token missing'
        });
    }
    if (tokenRecord.BonesID != req.params.BonesID) {
        logger.error('Authorization token invalid');
        return res.status(401).json({
            error: 'Authorization token invalid'
        });
    }

    if (!tokenRecord.TimeStamp) {
        logger.error('Authorization token missing');
        return res.status(401).json({
            error: 'Authorization token missing'
        });
    }

    const checkValue = Date.now() - tokenRecord.TimeStamp;
    if (checkValue > tokenDuration) {
        clearToken(req.token);
        logger.error('Authorization token expired');
        return res.status(401).json({
            error: 'Authorization token expired'
        });
    }

    try {
        req.basicToken = token;
        next();
    }
    catch (error) {
        var errorMsg = `Failed to assign token to request, ${error.message}`;
        logger.error(errorMsg);
        const err = new Error(errorMsg);
        err.status = 500;
        next(err);
    }
}