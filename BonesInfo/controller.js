const sequelize = require('../Common/database');
const defineBonesInfo = require('../Common/Models/BonesInfo');
const BonesInfo = defineBonesInfo(sequelize);

exports.POST = async (request, response) => {
    try
    {
        const {
            BonesID,
            SaveBonesJSON,
            SavGz,
        } = request.body;

        const bonesInfo = await BonesInfo.create({
            ID: BonesID,
            SaveBonesJSON: SaveBonesJSON,
            SavGz: SavGz,
        });
        response.status(201).json({
            success: true,
            bonesInfo: {
                BonesID: bonesInfo.ID,
                Uploaded: bonesInfo.Uploaded,
            },
        });
    }
    catch (error)
    {
        response.status(500).json({ success: false, error: error.message });
    }
};

exports.getBonesInfo = async (req, res) => {
    const bonesInfo = await BonesInfo.findByPk(req.user.userId);
    if (!bonesInfo)
        return res.status(404).json({ error: 'BonesInfo not found' });

    res.json({ success: true, data: bonesInfo });
};

exports.getAllBonesInfo = async (req, res) => {
    const bonesInfos = await BonesInfo.findAll();
    res.json({ success: true, data: bonesInfos });
};