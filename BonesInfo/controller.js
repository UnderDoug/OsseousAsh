const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { Bones } = require('../Common/Models/Bones');
const { User } = require('../Common/Models/User');

const getBonesInfo = async (req, res) => {
    try {
        var {
            BonesID,
            UserID,
        } = req.params

        bonesID = BonesID
        userID = req.token?.user?.UserID || UserID;

        const bones = await Bones.findByPk(BonesID);
        if (!bones) {
            var output = {
                error: `Bones Info not found: ${BonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        const bonesJSON = bones.SaveBonesJSON;

        bonesJSON.IsYou = userID
            && bonesJSON.UserID != userID;

        var user;
        if (userID) {
            user = await User.findByPk(userID);
        }

        if (!user
            || user.Access != 'Manage') {
            bonesJSON.UserID = '00000000-0000-0000-0000-000000000000'

            if (bonesJSON.Stats) {
                const statLabels = [
                    'Encountered',
                    'Defeated',
                    'Reclaimed',
                    'Broken',
                ]

                for (let i = 0; i < statLabels.length; i++) {
                    let stat = bonesJSON.Stats[statLabels[i]];
                    let statI = 0;
                    if (stat) {
                        for (let i = 0; i < stat.length; i++) {
                            if (UserID
                                && stat.UserID == userID) {
                                continue;
                            }
                            stat.UserID = statI++;
                        }
                    }
                }
            }
        }
        
        res.status(200).json(bones.SaveBonesJSON);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Info: ${BonesID}`,
            error: error.message
        });
    }
};

const getAllBonesInfo = async (req, res) => {
    try {
        var {
            from,
            to,
        } = req.params;

        var userID = req.token?.user?.UserID || req.params.UserID;

        if (!to) {
            from = 0;
            to = 0;
        }

        if (from > to) {
            [from, to] = [to, from];
        }

        var offset = from;
        var limit = Math.max(0, from - to);
        if (limit === 0) {
            limit = null;
        }

        const allBonesInfos = await Bones.findAll({
            attributes: ['SaveBonesJSON'],
            where: {
                SavGz: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
            offset: offset,
            limit: limit,
        });
        if ((allBonesInfos?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Bones, but no errors'
            });
            return;
        }

        const statLabels = [
            'Encountered',
            'Defeated',
            'Reclaimed',
            'Broken',
        ]

        var user;
        if (userID) {
            user = await User.findByPk(userID);
        }

        const canMan = user && user.Access == 'Manage';

        let bonesJSONs = new Array();
        for (let i = 0; i < allBonesInfos.length; i++) {
            let bonesJSON = allBonesInfos[i].SaveBonesJSON;

            bonesJSON.IsYou = userID
                && bonesJSON.UserID != userID;

            if (!canMan) {
                bonesJSON.UserID = '00000000-0000-0000-0000-000000000000'

                if (bonesJSON.Stats) {
                    for (let i = 0; i < statLabels.length; i++) {
                        let stat = bonesJSON.Stats[statLabels[i]];
                        let statI = 0;
                        if (stat) {
                            for (let i = 0; i < stat.length; i++) {
                                if (userID
                                    && stat.UserID == userID) {
                                    continue;
                                }
                                stat.UserID = statI++;
                            }
                        }
                    }
                }
            }
            bonesJSONs[i] = bonesJSON;
        }
        logger.info(`sending reponse`);
        res.status(200).json(bonesJSONs);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving All BonesInfos`,
            error: error.message
        });
    }
};

module.exports = {
    getBonesInfo,
    getAllBonesInfo,
};