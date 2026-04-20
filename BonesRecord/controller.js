const sequelize = require('../Common/database');
const defineBonesInfo = require('../Common/Models/BonesInfo');
const defineBonesSpec = require('../Common/Models/BonesSpec');
const BonesSpec = defineBonesSpec(sequelize);
const BonesInfo = defineBonesInfo(sequelize);

const createBones = async (req, res) => {
    var catchMessage = "";
    try {
        const {
            BonesID,
            SaveBonesJSON,
            SavGz,
        } = req.body;

        catchMessage = "Failed to create BonesInfo";
        const bonesInfo = await BonesInfo.create({
            ID: BonesID,
            SaveBonesJSON: SaveBonesJSON,
            SavGz: SavGz,
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
            success: true,
            BonesID: BonesID,
            Uploaded: bonesInfo.createdAt,
            bonesInfo: {
                SaveBonesJSON: bonesInfo.SaveBonesJSON,
                SavGz: bonesInfo.SavGz.byteLength,
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
    try {
        await BonesInfo.destroy({
            where: {
                ID: bonesID
            }
        });
        any = true;
    }
    catch (error) {
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
        message: message
    });
};

module.exports = {
    createBones,
    getBones,
    getAllBones,
    deleteBones,
};