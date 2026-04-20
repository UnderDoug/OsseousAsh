const sequelize = require('../Common/database');
const defineBonesSpec = require('../Common/Models/BonesSpec');
const BonesSpec = defineBonesSpec(sequelize);

const createBonesSpec = async (req, res) => {
    try {
        const {
            BonesID,
            Level,
            ZoneID,
            ZoneZ,
            ZoneTier,
            ZoneTerrainType,
            RegionTier,
            TerrainTravelClass,
        } = req.body;

        const bonesSpec = await BonesSpec.create({
            ID: BonesID,
            Level: Level,
            ZoneID: ZoneID,
            ZoneZ: ZoneZ,
            ZoneTier: ZoneTier,
            ZoneTerrainType: ZoneTerrainType,
            RegionTier: RegionTier,
            TerrainTravelClass: TerrainTravelClass,
        });

        res.status(201).json({
            success: true,
            boneSpec: {
                BonesID: bonesSpec.ID,
                Level: bonesSpec.Level,
                ZoneID: bonesSpec.ZoneID,
                Uploaded: bonesSpec.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating BonesSpec',
            error: error.message
        });
    }
};

const getBonesSpec = async (req, res) => {
    try {
        const bonesSpec = await BonesSpec.findByPk(req.params.BonesID);
        if (!bonesSpec)
            return res.status(404).json({
                success: false,
                error: 'BonesSpec not found: ' + req.params
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

const getAllBonesSpec = async (req, res) => {
    const bonesSpec = await BonesSpec.findAll();

    if (bonesSpec.length < 1)
        return res.status(204).json({
            success: true,
            message: 'No BonesSpecs, but no errors'
        })

    res.status(200).json({
        success: true,
        data: bonesSpec
    });
};

module.exports = {
    createBonesSpec,
    getBonesSpec,
    getAllBonesSpec,
};