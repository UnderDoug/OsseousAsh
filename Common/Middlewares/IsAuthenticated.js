if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const { logger } = require('../logger');
const { JWT_SECRET_KEY, USER_AUTH_REQUIRED } = process.env;
const TokenGenerator = require('../token-generator');
const jwtGen = new TokenGenerator(JWT_SECRET_KEY, JWT_SECRET_KEY, { expiresIn: '2m' });
const jwt = require('jsonwebtoken');

module.exports.checkAuth = async (req, res, next) => {
    try {
        const rawToken = req.header("jwt_token_header");

        if (!rawToken) {
            return logger.caught(res, 401, {
                error: 'No token provided'
            });
        }

        const token = jwt.verify(rawToken, JWT_SECRET_KEY);
        const newToken = jwtGen.refresh(rawToken); // , { verify: {} });

        req.token = token;
        res.setHeader('jwt_token_header', newToken)

        logger.info({token: token, newToken: newToken});

        next();
    }
    catch (error) {
        var err = error;
        err.status = 500;
        if (error.name === 'TokenExpiredError') {
            err.status = 401;
            err.message = 'Auth token expired'
        }
        else if (error.name === 'JsonWebTokenError') {
            err.status = 403;
            err.message = 'Invalid auth token'
        }
        next(err);
    }
};

module.exports.maybeCheckAuth = async (req, res, next) => {
    if (USER_AUTH_REQUIRED) {
        return await this.checkAuth(req, res, next);
    }
    else {
        next();
    }
};