const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { Bones } = require('../Common/Models/Bones');

const getBonesInfo = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bones = await Bones.findByPk(bonesID);
        if (!bones) {
            var output = {
                error: `Bones Info not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(bones.SaveBonesJSON);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Info: ${bonesID}`,
            error: error.message
        });
    }
};

const getAllBonesInfo = async (req, res) => {
    try {
        const allBonesInfos = await Bones.findAll({
            attributes: ['SaveBonesJSON'],
            where: {
                SavGz: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((allBonesInfos?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Bones, but no errors'
            });
            return;
        }
        let saveBonesJSONs = new Array();
        for (let i = 0; i < allBonesInfos.length; i++) {
            saveBonesJSONs[i] = allBonesInfos[i].SaveBonesJSON;
        }
        res.status(200).json(saveBonesJSONs);
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