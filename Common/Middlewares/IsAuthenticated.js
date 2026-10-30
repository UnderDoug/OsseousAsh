if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const {
    JWT_SECRET_KEY,
    JWT_SESSION_EXP,
} = process.env;

const { logger } = require('../logger');
const TokenGenerator = require('../token-generator');
const jwtGen = new TokenGenerator(JWT_SECRET_KEY, JWT_SECRET_KEY, { expiresIn: JWT_SESSION_EXP });
const jwt = require('jsonwebtoken');

const { User } = require('../Models/User');
const { statusTypes, accessLevels } = User

const processError = (error) => {
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
        case 'InvalidSession': {
            err.status = 403;
            break;
        }
        case 'NullSessionID':
        case 'MissingToken':
        case 'NullUserID':
        case 'MissingUser': {
            err.status = 400;
            break;
        }
        default:
            break;
    }
    return err;
}

const checkAccessLevel = (user, level, unless) => {
    if (!user) {
        let err = new Error(`User was null`);
        err.name = 'MissingUser';
        throw err;
    }
    if (accessLevels[user.Access] < accessLevels[level]) {
        if (!unless) {
            let err = new Error(`Insufficient user access`);
            err.name = 'InsufficientAccess';
            throw err;
        }
    }
    return true;
}

const checkStatusType = (user, type, unless) => {
    if (!user) {
        let err = new Error(`User was null`);
        err.name = 'MissingUser';
        throw err;
    }
    if (statusTypes[user.Status] < statusTypes[type]) {
        if (!unless) {
            let err = new Error(`Invalid user status: ${user.Status}`);
            err.name = 'InvalidUserStatus';
            throw err;
        }
    }
    return true;
}

module.exports.checkAuth = async (req, res, next) => {
    try {
        if (req.session?.user) {
            req.user = {
                ID: req.session.user,
                Status: 'Active',
                Access: 'Manage',
            }
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

        const user = await User.unscoped().findByPk(token.User);

        if (!user) {
            let err = new Error(`User was null`);
            err.name = 'MissingUser';
            throw err;
        }

        checkStatusType(user, 'Active');

        const newToken = await jwtGen.refresh(token, user); // , { verify: {} });

        req.token = token;
        req.user = {
            ID: user.ID,
            Status: user.Status,
            Access: user.Access,
            canManage: this.canManage(user),
        };
        res.setHeader('jwt_token_header', newToken)

        logger.info({
            token: token,
            newToken: newToken
        });

        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.checkCanDownload = async (req, res, next) => {
    try {
        checkAccessLevel(req.user, 'Down');
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.checkCanUpload = async (req, res, next) => {
    try {
        checkAccessLevel(req.user, 'Up');
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.canManage = (user) => {
    try {
        checkAccessLevel(user, 'Manage');
        return true;
    }
    catch {
        return false;
    }
} 

module.exports.checkCanManage = async (req, res, next) => {
    try {
        checkAccessLevel(req.user, 'Manage');
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}

module.exports.requireSelfOrManage = async (req, res, next) => {
    try {
        var unless = req.params?.UserID != null
            && req.user.ID == req.params.UserID;

        checkAccessLevel(req.user, 'Manage', unless);
        next();
    }
    catch (error) {
        var err = processError(error);
        next(err);
    }
}