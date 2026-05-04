const sequelize = require('../Common/database');
const defineBones = require('../Common/Models/Bones');
const Bones = defineBones(sequelize);
const { Op } = require('sequelize');

const getBonesSpec = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bones = await Bones.findByPk(bonesID);
        if (!bones)
            return res.status(404).json({
                success: false,
                error: `Bones Spec not found: ${bonesID}`
            });

        res.status(200).json({
            success: true,
            BonesSpec: bones.SaveBonesJSON.BonesSpec,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
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
        if (!allBonesInfos
            || allBonesInfos.length == 0)
            return res.status(204).json({
                success: true,
                message: 'No Bones, but no errors'
            });

        let bonesSpecs = new Array();
        for (let i = 0; i < allBonesInfos.length; i++) {
            bonesSpecs[i] = allBonesInfos[i].SaveBonesJSON.BonesSpec;
        }
        res.status(200).json({
            success: true,
            data: bonesSpecs
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving All BonesSpecs',
            error: error.message
        });
    }
};

module.exports = {
    getBonesSpec,
    getAllBonesSpecs,
};