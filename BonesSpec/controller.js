const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { Bones } = require('../Common/Models/Bones');

const getBonesSpec = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bones = await Bones.findByPk(bonesID);
        if (!bones) {
            var output = {
                error: `Bones Spec not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(bones.SaveBonesJSON.BonesSpec);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Spec: ${bonesID}`,
            error: error.message
        });
    }
};

const getAllBonesSpecs = async (req, res) => {
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

        let bonesSpecs = new Array();
        for (let i = 0; i < allBonesInfos.length; i++) {
            bonesSpecs[i] = allBonesInfos[i].SaveBonesJSON.BonesSpec;
        }
        res.status(200).json(bonesSpecs);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All BonesSpecs',
            error: error.message
        }
        logger.error(output);
        res.status(500).json(output);
    }
};

module.exports = {
    getBonesSpec,
    getAllBonesSpecs,
};