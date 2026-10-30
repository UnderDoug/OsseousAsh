if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const {
    JWT_SECRET_KEY,
    USER_DEFAULT_STATUS,
    USER_DEFAULT_ACCESS,
    JWT_SESSION_EXP,
} = process.env;

const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../Common/Models/User');
const { v4: newGuid } = require('uuid');

module.exports.getCanUp = async (req, res) => {
    try {
        res.status(200).json(req.params.UserID != null
            && await User.scope('canUp').findByPk(req.params.UserID) != null);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error checking user upload eligibility`,
            error: error.message
        });
    }
};

module.exports.createUser = async (req, res) => {
    try {
        const {
            ID,
            Handle,
            Status,
            Access,
            Password,
        } = req.body.User;

        if (!ID) {
            throw new Error(`Failed to create User: No ID`);
        }

        var status = USER_DEFAULT_STATUS;
        var access = USER_DEFAULT_ACCESS;
        if (req.user?.canManage) {
            status = Status || USER_DEFAULT_STATUS;
            access = Access || USER_DEFAULT_ACCESS;
        }

        const [user, created] = await User.unscoped().findOrCreate({
            where: {
                ID: ID
            },
            defaults: {
                ID: ID,
                Handle: Handle,
                Status: status,
                Access: access,
                Password: Password
            },
        });

        if (!user) {
            throw new Error(`Failed to create User: ${ID}`);
        }

        // logger.info(`new user created:\n{${user.ID}}: ${user.Handle}\n${User.Status}, ${User.Access}`);
        res.status(created ? 201 : 200).json(user);
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
        } = req.body.User;

        const user = await User.unscoped().findByPk(ID);

        if (!user) {
            var output = {
                method: 'updateUser',
                error: `User not found: ${ID}`
            };
            logger.warn({ output });
            return res.status(204).json(output);
        }

        logger.info(user);

        /*var log = {
            Field: null,
            Force: Force,
            User: user
        }*/

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
            /*log.Field = 'Handle';
            logger.info(log);*/
        }
        if (Status
            || Force) {
            catchMessage = `Failed to update Status: ${Status}`;
            fields[fields.length] = 'Status';
            any = true;
            user.update({
                Status: Status || Status.Value
            });
            /*log.Field = 'Status';
            logger.info(log);*/
        }
        if (Access
            || Force) {
            catchMessage = `Failed to update Access: ${Access}`;
            fields[fields.length] = 'Access';
            any = true;
            user.update({
                Access: Access || Access.Value
            });
            /*log.Field = 'Access';
            logger.info(log);*/
        }
        if (Password
            || Force) {
            catchMessage = `Failed to update Password: ********`;
            fields[fields.length] = 'Password';
            any = true;
            user.update({
                Password: Password || Password.Value
            });
            /*log.Field = 'Password';
            logger.info(log);*/
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

        throw new Error('No values with which to update User.')
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error updating User - ${catchMessage}`,
            error: error.message
        });
    }
};

module.exports.updateUserHandle = async (req, res) => {
    try {
        const ID = req.params.UserID;

        const {
            Handle,
        } = req.body.User;

        const user = await User.unscoped().findByPk(ID);

        if (!user) {
            var output = {
                method: 'updateUserHandle',
                error: `User not found: ${ID}`
            };
            logger.warn({ output });
            return res.status(204).json(output);
        }

        const originalHandle = user.Handle;

        catchMessage = `Failed to update Handle: ${Handle}`;
        any = true;
        user.update({
            Handle: Handle
        });

        catchMessage = `Failed to save User: ${ID}`;
        await user.save({
            fields: ['Handle'],
        });

        catchMessage = `Failed to reload User: ${ID}`;
        await user.reload();

        logger.info({
            Message: `Updated user handle "${originalHandle}" -> "${user.Handle}"`,
        });

        return res.status(200).json(user);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error updating User - ${catchMessage}`,
            error: error.message
        });
    }
};

module.exports.updateUserPassword = async (req, res) => {
    try {
        const ID = req.params.UserID;

        const {
            Password,
        } = req.body.User;

        const user = await User.unscoped().findByPk(ID);

        if (!user) {
            var output = {
                method: 'updateUserPassword',
                error: `User not found: ${ID}`
            };
            logger.warn({ output });
            return res.status(204).json(output);
        }

        const originalPassword = user.Password;

        var password = Password ? '********' : 'null';

        catchMessage = `Failed to update Password: ${password}`;
        any = true;
        user.update({
            Password: Password
        });

        catchMessage = `Failed to save User: ${ID}`;
        await user.save({
            fields: ['Password'],
        });

        catchMessage = `Failed to reload User: ${ID}`;
        await user.reload();

        logger.info({
            Message: `Updated user password "${originalPassword}" -> "${user.Password}"`,
        });

        return res.status(200).json(user);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error updating User - ${catchMessage}`,
            error: error.message
        });
    }
};

module.exports.getUser = async (req, res) => {
    const {
        UserID
    } = req.params;
    try {
        const user = await User.scope('includePassword').findByPk(UserID);
        if (!user) {
            var output = {
                method: 'getUser',
                error: `User not found: ${UserID}`
            };
            logger.warn(`${output.method}; ${output.error}`);
            return res.status(204).json(output);
        }

        res.status(200).json(user);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving User: ${UserID}`,
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

module.exports.getSession = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return logger.caught(res, 401, {
                error: `No authorization header provided`,
            });
        }

        const [type, Password] = authHeader.split(' ');
        if (type != 'basic') {
            return logger.caught(res, 401, {
                error: `Incorrect authorization format`,
            });
        }

        const { UserID } = req.params;
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

        const passwordCheck = await user?.checkPassword(Password);

        if (passwordCheck == null) {
            return logger.caught(res, 400, {
                error: 'Missing Password',
            });
        }

        if (!passwordCheck) {
            return logger.caught(res, 401, {
                error: 'Invalid credentials',
            });
        }

        var newSession = crypto.randomUUID();

        user.update({
            SessionID: newSession
        });

        await user.save({
            fields: ['SessionID'],
        });

        await user.reload();

        const payload = {
            User: UserID,
            SessionID: newSession,
        }

        const host = req.get('host');
        const params = {
            expiresIn: JWT_SESSION_EXP,
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

module.exports.getAllReports = async (req, res) => {
    try {
        const {
            UserID,
            BonesID
        } = req.params;

        var condition = {};

        if (UserID) {
            condition.UserID = UserID;
        }
        if (BonesID) {
            condition.BonesID = BonesID;
        }

        var reportsRaw = null;
        if (UserID
            || BonesID) {
            reportsRaw = await Report.findAll({
                where: condition,
                order: [
                    ['createdAt', 'DESC']
                ],
            });
        }
        else {
            reportsRaw = await Report.findAll({
                order: [
                    ['createdAt', 'DESC']
                ],
            });
        }
        const reports = reportsRaw;

        if ((reports?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Reports, but no errors'
            });
            return;
        }

        res.status(200).json(reports);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All Reports',
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

module.exports.deleteAllReports = async (req, res) => {
    var deleteCount = 0;
    var errors = {};
    var errorCount = 0;
    try {
        const {
            UserID,
            BonesID
        } = req.params;

        var condition = {};

        if (UserID) {
            condition.UserID = UserID;
        }
        if (BonesID) {
            condition.BonesID = BonesID;
        }

        var reportsRaw = null;
        if (UserID
            || BonesID) {
            reportsRaw = await Report.findAll({
                where: condition,
            });
        }
        else {
            reportsRaw = await Report.findAll();
        }
        const reports = reportsRaw;

        if ((reports?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Reports, but no errors'
            });
            return;
        }

        for (let i = 0; i < reports.length; i++) {
            let report = reports[i];
            try {
                await Report.destroy({
                    where: {
                        ID: report.ID
                    }
                });
            }
            catch (error) {
                let errorIndex = errorCount++;
                errors[errorIndex].reportID = report.ID;
                errors[errorIndex].error = error.message;
            }
        }
    }
    catch (error) {
        var output = {
            message: 'Error deleting All Reports',
            error: error.message,
            reportErrors: errors,
        }
        logger.error(output);
        res.status(500).json(output);
    }

    var message = `Deleted all Reports`;

    if (BonesID) {
        message += `, BonesID: ${BonesID}`;
    }
    if (UserID) {
        message += `, UserID: ${UserID}`;
    }
    var output = {
        deleted: deleteCount,
        message: message,
        reportErrors: errors,
    };
    logger.info(output);
    res.status(200).json(output);
};