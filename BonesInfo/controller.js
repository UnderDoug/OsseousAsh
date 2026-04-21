const sequelize = require('../Common/database');
const defineBonesInfo = require('../Common/Models/BonesInfo');
const BonesInfo = defineBonesInfo(sequelize);

const createBonesInfo = async (req, res) =>
{
    try {
        const {
            BonesID,
            SaveBonesJSON,
            SavGz,
        } = req.body;

        const bonesInfo = await BonesInfo.create({
            ID: BonesID,
            SaveBonesJSON: SaveBonesJSON,
            SavGz: Uint8Array.from(SavGz),
        });
        res.status(201).json({
            success: true,
            bonesInfo: {
                BonesID: bonesInfo.ID,
                Uploaded: bonesInfo.createdAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getBonesInfo = async (req, res) => {
    try {
        const bonesInfo = await BonesInfo.findByPk(req.params.BonesID);
        if (!bonesInfo)
            return res.status(404).json({
                success: false,
                error: 'BonesInfo not found: ' + req.params.BonesID
            });

        res.status(200).json({
            success: true,
            data: bonesInfo.SaveBonesJSON
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving BonesInfo',
            error: error.message
        });
    }
};

const getBonesSpec = async (req, res) => {
    try {
        const bonesInfo = await BonesInfo.findByPk(req.params.BonesID);
        if (!bonesInfo)
            return res.status(404).json({
                success: false,
                error: 'BonesInfo not found: ' + req.params.BonesID
            });

        const bonesSpec = bonesInfo.SaveBonesJSON.BonesSpec;
        if (!bonesSpec)
            return res.status(404).json({
                success: false,
                error: 'Bones BonesSpec not found: ' + req.params.BonesID
            });

        res.status(200).json({
            success: true,
            data: bonesSpec
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving BonesSpec',
            error: error.message
        });
    }
};

const getBonesSaveGz = async (req, res) => {
    try {
        const bonesID = req.params.BonesID;
        const bonesInfo = await BonesInfo.findByPk(bonesID);
        if (!bonesInfo)
            return res.status(404).json({
                success: false,
                error: 'Bones SavGz not found: ' + bonesID
            });

        /*res.status(200).json({
            success: true,
            SavGz: Uint8Array.from(bonesInfo.SavGz)
        });*/

        res.status(200).set(
            'Content-Type',
            'application/octet-stream'
        ).send(Uint8Array.from(bonesInfo.SavGz));

        /*res.status(200).json({
            OsseousAshRecord: {
                BonesID: bonesID,
                SaveBonesJSON: bonesInfo.SaveBonesJSON,
                //SavGz: Uint8Array.from(bonesInfo.SavGz)
                SavGz: bonesInfo.SavGz
            }
        });*/

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving Bones SavGz',
            error: error.message
        });
    }
};

const getAllBonesInfo = async (req, res) => {
    try {
        const bonesInfos = await BonesInfo.findAll();
        if (!bonesInfos)
            return res.status(204).json({
                success: true,
                message: 'No BonesInfos, but no errors'
            })

        var bonesSaveInfos = new Array();
        for (let i = 0; i < bonesInfos.length; i++) {
            bonesSaveInfos[i] = bonesInfos[i].SaveBonesJSON;
        }

        if (bonesSaveInfos.length < 1)
            return res.status(204).json({
                success: true,
                message: 'No BonesInfos, but no errors',
                data: null
            })

        res.status(200).json({
            success: true,
            data: bonesSaveInfos
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

const getAllBonesID = async (req, res) => {
    try {
        const bonesIDs = await BonesInfo.findAll({
            attributes: ['ID'],
        });
        if (!bonesIDs)
            return res.status(204).json({
                success: true,
                message: 'No BonesIDs, but no errors'
            })

        res.status(200).json({
            success: true,
            data: bonesIDs
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
    createBonesInfo,
    getBonesInfo,
    getBonesSpec,
    getBonesSaveGz,
    getAllBonesInfo,
    getAllBonesID,
};