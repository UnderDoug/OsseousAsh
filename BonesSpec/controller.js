const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { Bones } = require('../Common/Models/Bones');
const { BonesSpec } = require('../Common/Models/BonesSpec');
const { User } = require('../Common/Models/User');

const getBonesSpec = async (req, res) => {
    var bonesID;
    try {
        bonesID = req.params.BonesID
        const bonesSpec = await BonesSpec.findByPk(bonesID);
        if (!bonesSpec) {
            var output = {
                error: `Bones Spec not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(bonesSpec);
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
        const bonesSpecs = await BonesSpec.findAll({
            where: {
                Bones: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((bonesSpecs?.length || 0) == 0) {
            res.status(204).json({
                message: 'No BonesSpecs, but no errors'
            });
            return;
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

const getMatchingBonesSpecs = async (req, res) => {
    try {
        const allBonesInfos = await BonesSpec.findAll({
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

        var bonesSpecs = new Array();
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
    getMatchingBonesSpecs,
};