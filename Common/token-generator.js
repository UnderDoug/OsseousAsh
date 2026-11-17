if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const {
    JWT_SECRET_KEY,
    JWT_SESSION_EXP,
} = process.env;

const jwt = require('jsonwebtoken');
const User = require('./Models/User')
const Session = require('./Models/Session')

module.exports.TokenGenerator = class TokenGenerator {
    constructor(secretOrPrivateKey, secretOrPublicKey, options) {
        this.secretOrPrivateKey = secretOrPrivateKey || JWT_SECRET_KEY;
        this.secretOrPublicKey = secretOrPublicKey || JWT_SECRET_KEY;
        this.options = options; //algorithm + keyid + noTimestamp + expiresIn + notBefore
    }

    static errors = Object.freeze({
        nullUserID: 'TokenGeneratorNullUserID',
        missingUser: 'TokenGeneratorMissingUser',
        noSessions: 'TokenGeneratorNoSessions',
        invalidSession: 'TokenGeneratorInvalidSession',
    });

    static HeaderLabel = 'jwt_token_header';
    static INVALID = 'INVALID';

    sign(payload, signOptions) {
        const jwtSignOptions = Object.assign({}, signOptions, this.options);
        return jwt.sign(payload, this.secretOrPrivateKey, jwtSignOptions);
    }

    // refreshOptions.verify = options you would use with verify function
    // refreshOptions.jwtid = contains the id for the new token
    async refresh(token, user, res) {
        const errors = TokenGenerator.errors;
        if (!token.User) {
            let err = new Error(`token.User is null`);
            err.name = errors.nullUserID;
            throw err;
        }

        if (!user) {
            let err = new Error(`User is null`);
            err.name = errors.missingUser;
            throw err;
        }

        if (!user.Sessions
            || user.Sessions.length < 1) {
            let err = new Error(`No user sessions`);
            err.name = errors.noSessions;
            throw err;
        }

        for (let i = 0; i < user.Sessions.length; i++) {
            let session = user.Sessions[i];

            if (session.ID != token.SessionID) {
                continue;
            }

            if (!session.Valid) {
                let err = new Error(`Invalid Session [${session.ID}]`);
                err.name = errors.invalidSession;
                res?.setHeader(TokenGenerator.HeaderLabel, TokenGenerator.INVALID);
                session.destroy();
                throw err;
            }

            session.update({
                Valid: false,
            });

            await session.reload();

            session = await user.createSession();
            await user.reload();

            token.SessionID = session.ID;

            delete token.iat;
            delete token.exp;
            delete token.nbf;
            delete token.jti;

            // The first signing converted all needed options into claims, they are already in the payload
            return this.sign(token, this.options);
        }
        let err = new Error(`Invalid Session [${token.SessionID}]`);
        err.name = errors.invalidSession;
        res?.setHeader(TokenGenerator.HeaderLabel, TokenGenerator.INVALID);
        session.destroy();
        throw err;
    }
}