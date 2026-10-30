if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const {
    JWT_SECRET_KEY,
    JWT_SESSION_EXP,
} = process.env;

const jwt = require('jsonwebtoken');
const User = require('./Models/User')

class TokenGenerator {
    constructor(secretOrPrivateKey, secretOrPublicKey, options) {
        this.secretOrPrivateKey = secretOrPrivateKey || JWT_SECRET_KEY;
        this.secretOrPublicKey = secretOrPublicKey || JWT_SECRET_KEY;
        this.options = options; //algorithm + keyid + noTimestamp + expiresIn + notBefore
    }
    sign(payload, signOptions) {
        const jwtSignOptions = Object.assign({}, signOptions, this.options);
        return jwt.sign(payload, this.secretOrPrivateKey, jwtSignOptions);
    }
    // refreshOptions.verify = options you would use with verify function
    // refreshOptions.jwtid = contains the id for the new token
    async refresh(token, user) {
        if (!token.User) {
            let err = new Error(`token.User is null`);
            err.name = 'NullUserID';
            throw err;
        }

        if (!user) {
            let err = new Error(`User is null`);
            err.name = 'MissingUser';
            throw err;
        }

        if (!user.SessionID) {
            let err = new Error(`user.SessionID is null`);
            err.name = 'NullSessionID';
            throw err;
        }

        if (token.SessionID != user.SessionID) {
            let err = new Error(`Invalid SessionID [${token.SessionID}], expected [${user.SessionID}]`);
            err.name = 'InvalidSession';
            throw err;
        }

        var newSession = crypto.randomUUID();

        user.update({
            SessionID: newSession
        });

        await user.save({
            fields: ['SessionID'],
        });

        await user.reload();

        token.SessionID = newSession;

        delete token.iat;
        delete token.exp;
        delete token.nbf;
        delete token.jti;

        // The first signing converted all needed options into claims, they are already in the payload
        return this.sign(token, this.options);
    }
}



module.exports = TokenGenerator;