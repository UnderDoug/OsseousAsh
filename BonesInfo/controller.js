const sequelize = require('../Common/database');
const defineBones = require('../Common/Models/Bones');
const Bones = defineBones(sequelize);
const { Op } = require('sequelize');

const getBonesInfo = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bones = await Bones.findByPk(bonesID);
        if (!bones)
            return res.status(404).json({
                success: false,
                error: `Bones Info not found: ${bonesID}`
            });

        res.status(200).json({
            success: true,
            BonesInfo: bones.SaveBonesJSON,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
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
        if (!allBonesInfos
            || allBonesInfos.length == 0)
            return res.status(204).json({
                success: true,
                message: 'No Bones, but no errors'
            });
        let saveBonesJSONs = new Array();
        for (let i = 0; i < allBonesInfos.length; i++) {
            saveBonesJSONs[i] = allBonesInfos[i].SaveBonesJSON;
        }
        res.status(200).json({
            success: true,
            data: saveBonesJSONs
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving All BonesInfos',
            error: error.message
        });
    }
};

module.exports = {
    getBonesInfo,
    getAllBonesInfo,
};