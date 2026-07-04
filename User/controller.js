if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const { JWT_SECRET_KEY } = process.env;
const { logger } = require('../Common/logger');

const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../Common/Models/User');
const { v4: newGuid } = require('uuid');

module.exports.createUser = async (req, res) => {
    try {
        const {
            ID,
            Handle,
            Status,
            Access,
            Password,
        } = req.body;

        if (!ID) {
            throw new Error(`Failed to create User: No ID`);
        }

        const user = await User.create({
            ID: ID,
            Handle: Handle,
            Status: Status,
            Access: Access,
            Password: Password,
        });

        if (!user) {
            throw new Error(`Failed to create User: ${ID}`);
        }

        res.status(201).json(user);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error creating User`,
            error: error.message
        });
    }
};

module.exports.updateUser = async (req, res) => {
    try {

        const ID = req.params.UserID;

        //console.log(req);

        const {
            Handle,
            Status,
            Access,
            Password,
            Force,
        } = req.body;

        /*const Handle = req.body.Handle;
        const Status = req.body.Status;
        const Access = req.body.Access;
        const Password = req.body.Password;
        const Force = req.body.Force;*/

        const user = await User.findByPk(ID);

        if (!user) {
            var output = {
                error: `User not found: ${ID}`
            };
            logger.warn({ output });
            return res.status(204).json(output);
        }

        var any = false;
        var fields = new Array();
        if (Handle
            || Force) {
            catchMessage = `Failed to update Handle: ${Handle}`;
            fields[fields.length] = 'Handle';
            any = true;
            user.update({
                Handle: Handle || Handle.Value
            });
        }
        if (Status
            || Force) {
            catchMessage = `Failed to update Status: ${Status}`;
            fields[fields.length] = 'Status';
            any = true;
            user.update({
                Status: Status || Status.Value
            });
        }
        if (Access
            || Force) {
            catchMessage = `Failed to update Access: ${Access}`;
            fields[fields.length] = 'Access';
            any = true;
            user.update({
                Access: Access || Access.Value
            });
        }
        if (Password
            || Force) {
            catchMessage = `Failed to update Password: ********`;
            fields[fields.length] = 'Password';
            any = true;
            user.update({
                Password: Password || Password.Value
            });
        }

        if (any) {
            catchMessage = `Failed to save User: ${ID}`;
            await user.save({
                fields: fields,
            });

            catchMessage = `Failed to reload User: ${ID}`;
            await user.reload();

            return res.status(201).json(user);
        }

        throw new Error('No values to update User with.')
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error updating User`,
            error: error.message
        });
    }
};

module.exports.getUser = async (req, res) => {
    let userID;
    try {
        userID = req.params.UserID
        const user = await User.scope('includePassword').findByPk(userID);
        if (!user) {
            var output = {
                error: `User not found: ${userID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(user);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving User: ${userID}`,
            error: error.message
        });
    }
};

module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            order: [
                ['createdAt', 'ASC']
            ],
        });
        if ((users?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Users, but no errors'
            });
            return;
        }

        res.status(200).json(users);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: 'Error retrieving All Users',
            error: error.message
        });
    }
};

module.exports.getUserStatus = async (req, res) => {
    var userID;
    try {
        userID = req.params.UserID;
        const user = await User.findOne({
            attributes: ['Status'],
            where: {
                ID: req.params.UserID,
            },
        });

        if (!user) {
            var output = {
                message: `Failed to find User: ${userID}`,
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(user.Status);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving User Status: ${userID}`,
            error: error.message
        });
    }
};

module.exports.getUserHandle = async (req, res) => {
    var userID;
    try {
        userID = req.params.UserID;
        const user = await User.findOne({
            attributes: ['Handle'],
            where: {
                ID: req.params.UserID,
            },
        });

        if (!user) {
            var output = {
                message: `Failed to find User: ${userID}`,
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(user.Handle);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving User Handle: ${userID}`,
            error: error.message
        });
    }
};

module.exports.postLogin = async (req, res) => {
    try {
        const { UserID, Password } = req.body;
        if (!UserID) {
            return logger.caught(res, 400, {
                error: 'Missing UserID',
            });
        }

        const user = await User.scope('includePassword').findByPk(UserID);

        if (!user) {
            return logger.caught(res, 204, {
                error: `User not found: ${UserID}`,
            });
        }

        const userPassword = user.passwordValue();
        const matchingNoPassword = !Password && !userPassword;

        if (!Password && !matchingNoPassword) {
            return logger.caught(res, 400, {
                error: 'Missing Password',
            });
        }

        var isValidPassword = matchingNoPassword;
        if (!isValidPassword) {
            isValidPassword = await bcrypt.compare(Password, userPassword);
        }

        if (!isValidPassword) {
            return logger.caught(res, 401, {
                error: 'Invalid credentials',
            });
        }

        const payload = {
            UserID: UserID,
        }

        const host = req.get('host');
        const params = {
            expiresIn: '2m',
            issuer: host,
            audience: host,
        };
        const token = jwt.sign(
            payload,
            JWT_SECRET_KEY,
            params,
        );

        logger.info({ token: token, user: payload });
        res.status(200).json({
            token: token,
            user: user,
            expiresIn: params.expiresIn,
        });
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error logging in User`,
            error: error.message
        });
    }
};