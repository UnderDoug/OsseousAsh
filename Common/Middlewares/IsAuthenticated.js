if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const {
    JWT_SECRET_KEY,
    JWT_SESSION_EXP,
} = process.env;

const { logger } = require('../logger');
const { TokenGenerator } = require('../token-generator');
const jwtGen = new TokenGenerator(JWT_SECRET_KEY, JWT_SECRET_KEY, { expiresIn: JWT_SESSION_EXP });
const jwt = require('jsonwebtoken');

const { User, Bones } = require('../models');
const { statusTypes, accessLevels } = User

const processError = (error, res) => {
    const tgErrors = TokenGenerator.errors;
    var err = error;
    err.status = 500;
    switch (error.name) {
        case 'TokenExpiredError': {
            err.status = 401;
            err.message = 'Auth token expired';
            break;
        }
        case 'JsonWebTokenError': {
            err.status = 403;
            err.message = 'Invalid auth token';
            break;
        }
        case 'InvalidUserStatus':
        case 'InsufficientAccess':
        case tgErrors.invalidSession: {
            err.status = 403;
            break;
        }
        case tgErrors.noSessions:
        case 'MissingToken':
        case tgErrors.nullUserID:
        case 'NullUserID':
        case tgErrors.missingUser:
        case 'MissingUser': {
            err.status = 400;
            break;
        }
        default:
            break;
    }
    return err;
}

module.exports.checkAuth = async (req, res, next) => {
    try {
        if (req.session?.user) {
            req.user = await User.findByPk(req.session.user);
            return next();
        }

        const rawToken = req.header("jwt_token_header");

        if (!rawToken) {
            let err = new Error(`No token provided`);
            err.name = 'MissingToken';
            throw err;
        }

        const token = jwt.verify(rawToken, JWT_SECRET_KEY);

        if (!token.User) {
            let err = new Error(`token.User is null`);
            err.name = 'NullUserID';
            throw err;
        }

        const user = await User.unscoped().findByPk(token.User, {
            include: [{
                association: User.Sessions,
                attributes: ['ID', 'Valid'],
            }],
        });

        if (!user) {
            let err = new Error(`User was null`);
            err.name = 'MissingUser';
            throw err;
        }

        user.checkStatusType('Active');

        const newToken = await jwtGen.refresh(token, user, res); // , { verify: {} });

        req.token = token;
        req.user = user;
        res.setHeader('jwt_token_header', newToken)

        logger.info(`New JwtToken issued to ${token.User}; SessionID: ${token.SessionID}`);

        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.checkCanDownload = async (req, res, next) => {
    try {
        User.checkAccessLevel(req.user, 'Down');
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.checkCanUpload = async (req, res, next) => {
    try {
        User.checkAccessLevel(req.user,'Up');
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.checkCanManage = async (req, res, next) => {
    try {
        User.checkAccessLevel(req.user, 'Manage');
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.requireSelfOrManage = async (req, res, next) => {
    try {
        var isOwner = false;
        const authedUserID = req.user.ID;
        const paramsUserID = req.params?.UserID;
        const bodyUserID = req.body?.UserID;
        const bonesID = req.body?.BonesID || req.params?.BonesID;

        const output = {
            authedUserID: authedUserID,
            paramsUserID: paramsUserID,
            bodyUserID: bodyUserID,
            bonesID: bonesID,
            isOwner: {
                init: isOwner,
            },
        };
        if (paramsUserID) {
            let value = authedUserID == paramsUserID;
            if (!isOwner)
                isOwner = value;
            output.isOwner.params = value;
        }
        if (bodyUserID) {
            let value = authedUserID == bodyUserID;
            if (!isOwner)
                isOwner = value;
            output.isOwner.body = value;
        }
        if (bonesID) {
            const bones = await Bones.scope(Bones.forOutputCleanScope).findByPk(bonesID);

            let value = bones && (bones.UserID == authedUserID);
            if (!isOwner)
                isOwner = value;
            output.isOwner.bones = value;
            output.bones = {
                ID: bones && bones.ID,
                UserID: bones && bones.UserID,
            };
        }
        output.isOwner.final = isOwner;

        logger.info(JSON.stringify(output, null, 4));

        User.checkAccessLevel(req.user, 'Manage', isOwner);
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}