const sequelize = require('../Common/database');
const defineBonesSpec = require('../Common/Models/BonesSpec');
const BonesSpec = defineBonesSpec(sequelize);

exports.newBonesInfo = async (req, res) =>
{
    try
    {
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
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBonesSpec = async (req, res) =>
{
    const bonesSpec = await BonesSpec.findByPk(req.user.userId);
    if (!bonesSpec)
        return res.status(404).json({ error: 'BonesSpec not found' });

    res.json({ success: true, data: bonesSpec });
};

exports.getAllBonesSpec = async (req, res) =>
{
    const bonesSpecs = await BonesSpec.findAll();
    res.json({ success: true, data: bonesSpecs });
};