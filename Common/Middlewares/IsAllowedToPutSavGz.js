const sequelize = require('../database');
const defineBones = require('../Models/Bones');
const Bones = defineBones(sequelize);
const { Op } = require('sequelize');

const tokenDuration = 180000; // 3 minutes in ms

const tokenRecords = {}

const clearToken = (token, doClearTimeout = true) => {
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
        console.log('Failed to clear token:', token, ',', error.message);
    }
}

const getToken = (BonesID) => {
    try {
        var token = crypto.randomUUID();
        tokenRecords[token] = {
            BonesID: BonesID,
            TimeStamp: Date.now(),
            Timer: setTimeout(async () => {
                console.log('Expired token', token ?? 'NO_TOKEN', ',', 'deleting dataless Bones:', BonesID);
                try {
                    await Bones.destroy({
                        where: {
                            ID: BonesID,
                            SavGz: { [Op.is]: null },
                        }
                    });
                }
                catch (error) {
                    console.log('Error deleting Bones', BonesID ?? 'NO_BONES_ID', ',', error.message);
                }

                clearToken(token, false);
            }, tokenDuration),
        };
        return token;
    }
    catch (error) {
        console.log('Failed to create token:', token ?? 'NO_TOKEN', ',', error.message);
    }
}

const allow = (req, res, next) => {
    try {
        req.token = getToken(req.body.BonesID);
        console.log('BonesID:', req.body.BonesID, 'token:', req.token);
        next();
    }
    catch (error) {
        console.log('Failed to create token for follow up SavGz PUT');
        const err = new Error(`Failed to create token for follow up SavGz PUT, ${error.message}`);
        err.status = 500;
        next(err);
    }
};

const check = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('No authorization header provided');
        return res.status(401).json({
            error: 'No authorization header provided'
        });
    }

    var tokenRecord = tokenRecords[authHeader];
    if (!tokenRecord) {
        console.log('Authorization token missing');
        return res.status(401).json({
            error: 'Authorization token missing'
        });
    }
    if (tokenRecord.BonesID != req.params.BonesID) {
        console.log('Authorization token invalid');
        return res.status(401).json({
            error: 'Authorization token invalid'
        });
    }

    if (!tokenRecord.TimeStamp) {
        console.log('Authorization token missing');
        return res.status(401).json({
            error: 'Authorization token missing'
        });
    }

    const checkValue = Date.now() - tokenRecord.TimeStamp;
    if (checkValue > tokenDuration) {
        clearToken(req.token);
        console.log('Authorization token expired');
        return res.status(401).json({
            error: 'Authorization token expired'
        });
    }

    try {
        req.token = authHeader;
        next();
    }
    catch (error) {
        var errorMsg = `Failed to assign token to request, ${error.message}`;
        console.log(errorMsg);
        const err = new Error(errorMsg);
        err.status = 500;
        next(err);
    }
};

module.exports = {
    tokenDuration,
    tokenRecords,
    clearToken,
    allow,
    check,
}