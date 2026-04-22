const sequelize = require('../database');
const defineBonesInfo = require('../Models/BonesInfo');
const defineBonesSpec = require('../Models/BonesSpec');
const BonesSpec = defineBonesSpec(sequelize);
const BonesInfo = defineBonesInfo(sequelize);
const { Op } = require('sequelize');

exports.tokenDuration = 180000; // 3 minutes in ms

exports.IDsByToken = {};
exports.TokenTimestamps = {};
exports.TokenTimers = {};

exports.clearToken = (token, doClearTimeout = true) => {
    try {
        if (this.IDsByToken[token]) {
            this.IDsByToken[token] = null;
        }
        if (this.TokenTimestamps[token]) {
            this.TokenTimestamps[token] = null;
        }
        if (this.TokenTimers[token]) {
            if (doClearTimeout)
                clearTimeout(this.TokenTimers[token]);
            this.TokenTimers[token] = null;
        }
    }
    catch (error) {
        console.log('Failed to clear token:', token, ',', error.message);
    }
}

const getToken = (BonesID) => {
    try {
        var token = crypto.randomUUID();
        this.IDsByToken[token] = BonesID;
        this.TokenTimestamps[token] = Date.now();
        this.TokenTimers[token] = setTimeout(async () => {
            console.log('Expired token', token ?? 'NO_TOKEN', ',', 'deleting dataless BonesInfo:', BonesID);
            var deleteSpec = false;
            try {
                await BonesInfo.destroy({
                    where: {
                        ID: BonesID,
                        SavGz: { [Op.is]: null },
                    }
                });
                deleteSpec = true;
            }
            catch (error) {
                console.log('Error deleting BonesInfo', BonesID ?? 'NO_BONES_ID', ',', error.message);
            }

            if (deleteSpec) {
                try {
                    await BonesSpec.destroy({
                        where: { ID: BonesID, }
                    });
                }
                catch (error) {
                    console.log('Error deleting BonesSpec', BonesID ?? 'NO_BONES_ID', ',', error.message);
                }
            }
            this.clearToken(token, false);
        }, this.tokenDuration)
        return token;
    }
    catch (error) {
        console.log('Failed to create token:', token ?? 'NO_TOKEN', ',', error.message);
    }
}

exports.allow = (req, res, next) => {
    try {
        req.token = getToken(req.body.BonesID);
        console.log('BonesID:', req.body.BonesID, 'token:', req.token);
        next();
    }
    catch (error) {
        console.log('Failed to create token for follow up SavGz PUT');
        return res.status(500).json({
            message: 'Failed to create token for follow up SavGz PUT',
            error: error.message
        });
    }
};

exports.check = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('No authorization header provided');
        return res.status(401).json({
            error: 'No authorization header provided'
        });
    }
    
    if (this.IDsByToken[authHeader] != req.params.BonesID) {
        console.log('Authorization token invalid');
        return res.status(401).json({
            error: 'Authorization token invalid'
        });
    }

    const tokenTimeStamp = this.TokenTimestamps[authHeader];
    if (!tokenTimeStamp) {
        console.log('Authorization token missing');
        return res.status(401).json({
            error: 'Authorization token missing'
        });
    }

    const checkValue = Date.now() - tokenTimeStamp;
    if (checkValue > this.tokenDuration) {
        this.clearToken(req.token);
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
        console.log('Failed to assign token to request');
        res.status(500).json({
            message: 'Failed to assign token to request',
            error: error.message
        });
    }
};