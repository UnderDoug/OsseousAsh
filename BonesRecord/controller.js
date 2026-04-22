const sequelize = require('../Common/database');
const defineBonesInfo = require('../Common/Models/BonesInfo');
const defineBonesSpec = require('../Common/Models/BonesSpec');
const BonesSpec = defineBonesSpec(sequelize);
const BonesInfo = defineBonesInfo(sequelize);
const { IDsByToken, clearToken } = require('../common/middlewares/IsAllowedToPutSavGz');
const { Op } = require('sequelize');

const Ajv = require('ajv');
const ajv = new Ajv();
const schema = {
    type: 'object',
    required: ['BonesID', 'SaveBonesJSON'],
    properties: {
        BonesID: {
            type: 'string',
            minLength: 36,
            maxLength: 36,
        },
        SaveBonesJSON: {
            type: 'object',
        }
    }
};
const validate = ajv.compile(schema);

const createBones = async (req, res) => {
    /*if (!validate(req.body)) {
        return res.status(400).json({
            error: 'Invalid input',
            details: validate.errors
        });
    }*/

    var catchMessage = "";
    try {
        const {
            BonesID,
            SaveBonesJSON,
        } = req.body;

        catchMessage = "Failed to create BonesInfo";
        const bonesInfo = await BonesInfo.create({
            ID: BonesID,
            SaveBonesJSON: SaveBonesJSON,
        });

        const jsonBonesSpec = SaveBonesJSON.BonesSpec;
        catchMessage = "Failed to create BonesSpec";
        const bonesSpec = await BonesSpec.create({
            ID: BonesID,
            Level: jsonBonesSpec.Level,
            ZoneID: jsonBonesSpec.ZoneID,
            ZoneZ: jsonBonesSpec.ZoneZ,
            ZoneTier: jsonBonesSpec.ZoneTier,
            ZoneTerrainType: jsonBonesSpec.ZoneTerrainType,
            RegionTier: jsonBonesSpec.RegionTier,
            TerrainTravelClass: jsonBonesSpec.TerrainTravelClass,
        });

        res.status(201).json({
            success: req.token,
            BonesID: BonesID,
            Uploaded: bonesInfo.createdAt,
            bonesInfo: {
                SaveBonesJSON: bonesInfo.SaveBonesJSON,
                SavGz: 'to be PUT directly',
            },
            boneSpec: {
                Level: bonesSpec.Level,
                ZoneID: bonesSpec.ZoneID,
                ZoneZ: bonesSpec.ZoneZ,
                ZoneTier: bonesSpec.ZoneTier,
                ZoneTerrainType: bonesSpec.ZoneTerrainType,
                RegionTier: bonesSpec.RegionTier,
                TerrainTravelClass: bonesSpec.TerrainTravelClass,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: catchMessage,
            error: error.message
        });
    }
};

const addBonesSavGz = async (req, res) => {
    var catchMessage = "";
    try {
        const bonesID = IDsByToken[req.token];

        catchMessage = "Failed to find BonesInfo";
        var bonesInfo = await BonesInfo.findByPk(bonesID);

        catchMessage = "Failed to update BonesInfo SavGz";
        bonesInfo.update({
            SavGz: req.body
        });
        catchMessage = "Failed to save BonesInfo SavGz";
        await bonesInfo.save({
            fields: ['SavGz']
        });

        catchMessage = "Failed to reload BonesInfo";
        await bonesInfo.reload();

        res.status(201).json({
            success: true,
            BonesID: bonesID,
            SavGz: (Uint8Array.from(bonesInfo.SavGz).byteLength / 1000) + 'kb',
        });
        clearToken(req.token);
    }
    catch (error) {
        console.log(catchMessage, error.message)
        res.status(500).json({
            success: false,
            message: catchMessage,
            error: error.message
        });
    }
};

const getBones = async (req, res) => {
    try {
        const bonesInfo = await BonesInfo.findByPk(req.params.BonesID);
        if (!bonesInfo)
            return res.status(404).json({
                success: false,
                error: 'BonesInfo not found: ' + req.params.BonesID
            });
    
        const bonesSpec = await BonesSpec.findByPk(req.params.BonesID);
        if (!bonesSpec)
            return res.status(404).json({
                success: false,
                error: 'BonesSpec not found: ' + req.params
            });

        res.status(200).json({
            success: true,
            BonesInfo: bonesInfo,
            BonesSpec: bonesSpec,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving BonesRecord',
            error: error.message
        });
    }
};

const getAllBones = async (req, res) => {
    try {
        const bonesInfos = await BonesInfo.findAll();
        const bonesSpecs = await BonesSpec.findAll();

        var bonesData = new Array();

        try {
            for (let i = 0; i < bonesInfos.length; i++) {
                var bonesInfoI = bonesInfos[i];
                var bonesSpecI = bonesSpecs.find(bs => bs.ID === bonesInfoI.ID);

                if (!bonesSpecI)
                    continue;

                if (!bonesInfoI.SavGz)
                    continue;

                bonesData[i] = {
                    'BonesInfo': bonesInfoI,
                    'BonesSpec': bonesSpecI,
                };
            }

            if (bonesData.length < 1)
                return res.status(204).json({
                    success: true,
                    message: 'No bones, but no errors'
                })

            res.status(200).json({
                success: true,
                data: bonesData,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error collating BonesData',
                error: error.message
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving BonesData',
            error: error.message
        });
    }
};

const deleteBones = async (req, res) => {
    var bonesID = req.params.BonesID;
    var any = false;
    var errors = new Array();
    try {
        await BonesInfo.destroy({
            where: {
                ID: bonesID
            }
        });
        any = true;
    }
    catch (error) {
        errors[errors.lenth + 1] = error.message;
        res.status(500).json({
            success: false,
            message: 'Error deleting BonesInfo',
            error: error.message
        });
    }

    try {
        await BonesSpec.destroy({
            where: {
                ID: bonesID
            }
        });
        any = true;
    }
    catch (error) {
        errors[errors.lenth + 1] = error.message;
        res.status(500).json({
            success: false,
            message: 'Error deleting BonesSpec',
            error: error.message
        });
    }

    var message = 'No Bones with with BonesID: ' + bonesID;
    if (any)
        message = 'Deleted Bones with BonesID: ' + bonesID;

    res.status(200).json({
        success: true,
        message: message,
        errors: errors
    });
};

const deleteAllBones = async (req, res) => {
    var noInfos = false;
    var noSpecs = false;
    var any = false;
    try {
        const bonesInfos = await BonesInfo.findAll();
        const bonesSpecs = await BonesSpec.findAll();

        noInfos = !bonesInfos;
        noSpecs = !bonesSpecs;
        
        if (!noInfos) {
            for (let i = 0; i < bonesInfos.length; i++) {
                try {
                    await BonesInfo.destroy({
                        where: {
                            ID: bonesInfos[i].ID
                        }
                    });
                    any = true;
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: 'Error deleting BonesInfo: ' + bonesInfos[i].ID,
                        error: error.message
                    });
                }
            }
        }

        if (!noSpecs) {
            for (let i = 0; i < bonesSpecs.length; i++) {
                try {
                    await BonesSpec.destroy({
                        where: {
                            ID: bonesSpecs[i].ID
                        }
                    });
                    any = true;
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: 'Error deleting BonesSpec: ' + bonesSpecs[i].ID,
                        error: error.message
                    });
                }
            }
        }

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting Bones',
            error: error.message
        });
    }

    if (!any)
        return res.status(204).json({
            success: true,
            message: 'No bones, but no errors'
        })

    res.status(200).json({
        success: true,
        message: 'Deleted all Bones'
    });
};

const tidyBones = async () => {
    console.log('Tidying bone fragments...');
    try {
        const invalidBonesIDs = await BonesInfo.findAll({
            attribute: ['ID'],
            where: {
                SavGz: { [Op.is]: null },
            }
        });

        var fragments = 0;
        if (invalidBonesIDs) {
            for (let i = 0; i < invalidBonesIDs.length; i++) {
                let bonesID = invalidBonesIDs[i].ID;
                try {
                    await BonesInfo.destroy({
                        where: {
                            ID: bonesID,
                        },
                    });
                    fragments++;
                }
                catch (error) {
                    console.log('Error tidying BonesInfo with null SavGz', error.message);
                }

                try {
                    await BonesSpec.destroy({
                        where: {
                            ID: bonesID,
                        },
                    });
                    fragments++;
                }
                catch (error) {
                    console.log('Error tidying BonesSpec with null SavGz', error.message);
                }
            }
        }

        const bonesSpecIDs = await BonesSpec.findAll({
            attribute: ['ID'],
        });

        if (bonesSpecIDs) {
            for (let i = 0; i < bonesSpecIDs.length; i++) {
                let bonesID = bonesSpecIDs[i].ID;
                try {
                    if (!(await BonesInfo.findByPk(bonesID))) {
                        await BonesSpec.destroy({
                            where: {
                                ID: bonesID,
                            },
                        });
                        fragments++;
                    }
                }
                catch (error) {
                    console.log('Error tidying orphaned BonesSpec', error.message);
                }
            }
        }
    }
    catch (error) {
        console.log('Error tidying Bones', error.message);
    }
    console.log(fragments + ' bone fragments tidied!');
}

module.exports = {
    createBones,
    addBonesSavGz,
    getBones,
    getAllBones,
    deleteBones,
    deleteAllBones,
    tidyBones,
};