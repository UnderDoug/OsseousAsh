const { logger } = require('../logger');
const { Op } = require('sequelize');
const {
    Bones,
    Report,
    BonesSpec,
    BonesStats,
    ModConfig,
    ModConfigRecord,
} = require('../models');

module.exports.uploadTokenDuration = 180000; // 3 minutes in ms

module.exports.uploadTokenRecords = {};

module.exports.clearUploadToken = (token, doClearTimeout = true) => {
    try {
        var tokenRecord = this.uploadTokenRecords[token];
        if (tokenRecord) {
            if (tokenRecord.BonesID) {
                delete tokenRecord.BonesID;
            }
            if (tokenRecord.TimeStamp) {
                delete tokenRecord.TimeStamp;
            }
            if (tokenRecord.Timer) {
                if (doClearTimeout
                    || tokenRecord.ClearAttemps++ > 2) {
                    clearTimeout(tokenRecord.Timer);
                    delete tokenRecord.Timer;
                }
            }
            if (this.uploadTokenRecords[token]) {
                delete this.uploadTokenRecords[token];
            }
        }
    }
    catch (error) {
        logger.error(`Failed to clear token: ${token}, ${error.message}`);
    }
}

module.exports.tidyDatalessBones = async (Token) => {
    const bonesID = this.getBonesID(Token);
    const BonesController = require('../../Bones/controller');
    let tokenString = Token ?? 'NO_TOKEN';
    logger.info(`Expired token ${tokenString}; deleting dataless Bones: ${bonesID}`);
    var catchMessage = `top of the run`;
    try {
        if (!await Bones.findByPk(bonesID)) {
            catchMessage = `tidySingleBones`;
            var fragments = await BonesController.tidySingleBones(bonesID, { Errors: 0 });
            logger.info(`bone fragments tidied!\n${JSON.stringify(fragments, null, 4)}\n`);
        }
        else {
            logger.info(`bones with ID [${bonesID}] has data!`);
        }
    }
    catch (error) {
        let bonesID = bonesID ?? 'NO_BONES_ID';
        logger.error(`Error deleting UploadToken ${tokenString}; deleting dataless Bones (${catchMessage}): [${bonesID}], ${error.message}`);
    }

    this.clearUploadToken(Token, false);
};

module.exports.produceUploadToken = (BonesID) => {
    try {
        var token = crypto.randomUUID();
        this.uploadTokenRecords[token] = {
            BonesID: BonesID,
            TimeStamp: Date.now(),
            ClearAttemps: 0,
            Timer: setTimeout(this.tidyDatalessBones, this.uploadTokenDuration, token),
        };
        return token;
    }
    catch (error) {
        let tokenString = token ?? 'NO_TOKEN';
        logger.error(`Failed to create UploadToken: ${tokenString}, ${error.message}`);
    }
}

module.exports.assignUploadToken = (req, res, next) => {
    try {
        req.basicToken = this.produceUploadToken(req.body?.BonesID);
        logger.info(`BonesID: ${req.body?.BonesID}, UploadToken: ${req?.basicToken}`);
        next();
    }
    catch (error) {
        const err = new Error(`Failed to create UploadToken for follow up SavGz PUT, ${error.message}`);
        err.status = 500;
        next(err);
    }
}

module.exports.checkUploadAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        logger.info('No authorization header provided');
        var bonesID = req.params?.BonesID;
        if (bonesID) {
            let token = this.getToken(bonesID);
            if (token) {
                this.tidyDatalessBones(req.token);
            }
        }
        return res.status(401).json({
            error: 'No authorization header provided',
            cancel: true,
        });
    }

    const [type, token] = authHeader.split(' ');
    if (type != 'basic') {
        logger.error('No upload token provided');
        return res.status(401).json({
            error: 'No upload token provided',
            cancel: true,
        });
    }

    var tokenRecord = this.uploadTokenRecords[token];
    if (!tokenRecord) {
        logger.error('Upload token missing');
        return res.status(401).json({
            error: 'Upload token missing',
            cancel: true,
        });
    }
    if (tokenRecord.BonesID != req.params.BonesID) {
        logger.error('Upload token invalid');
        this.tidyDatalessBones(req.token);
        return res.status(401).json({
            error: 'Upload token invalid'
        });
    }

    if (!tokenRecord.TimeStamp) {
        logger.error('Upload token missing timestamp');
        this.tidyDatalessBones(req.token);
        return res.status(401).json({
            error: 'Upload token missing timestamp'
        });
    }

    const checkValue = Date.now() - tokenRecord.TimeStamp;
    if (checkValue > this.uploadTokenDuration) {
        this.tidyDatalessBones(req.token);
        logger.error('Upload token expired');
        return res.status(401).json({
            error: 'Upload token expired'
        });
    }

    try {
        req.basicToken = token;
        next();
    }
    catch (error) {
        var errorMsg = `Failed to assign upload token to request, ${error.message}`;
        const err = new Error(errorMsg);
        err.status = 500;
        next(err);
    }
}

module.exports.getBonesID = (Token) => {
    if (Token) {
        return this.uploadTokenRecords[Token]?.BonesID;
    }
}

module.exports.getToken = (BonesID) => {
    if (BonesID) {
        const keys = Object.keys(this.uploadTokenRecords);
        return keys.reduce(function (acc, next, index) {
            if (!acc) {
                if (this[next].BonesID == BonesID) {
                    acc = next;
                }
            }
            return acc;
        }, this.uploadTokenRecords);
    }
    return null;
}