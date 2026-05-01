const sequelize = require('../Common/database');
const defineBones = require('../Common/Models/Bones');
const Bones = defineBones(sequelize);
const { tokenRecords, clearToken } = require('../Common/Middlewares/IsAllowedToPutSavGz');
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
            Size,
        } = req.body;

        catchMessage = "Failed to create BonesInfo";
        const bonesInfo = await Bones.create({
            ID: BonesID,
            SaveBonesJSON: SaveBonesJSON,
            Size: Size,
        });

        res.status(201).json({
            success: req.token,
            BonesID: BonesID,
            BonesInfo: bonesInfo.SaveBonesJSON,
            SavGz: {
                Size: `${bonesInfo.Size/1000} KB`,
                Data: 'to be PUT directly',
            },
            Uploaded: bonesInfo.createdAt,
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
    var catchMessage = '';
    var bonesID;
    try {
        bonesID = tokenRecords[req.token].BonesID;

        catchMessage = `Failed to find Bones: ${bonesID}`;
        var bones = await Bones.findByPk(bonesID);

        catchMessage = `Failed to update Bones SavGz: ${bonesID}`;
        bones.update({
            SavGz: req.body
        });
        catchMessage = `Failed to save Bones SavGz: ${bonesID}`;
        await bones.save({
            fields: ['SavGz']
        });

        catchMessage = `Failed to reload Bones: ${bonesID}`;
        await bones.reload();

        res.status(201).json({
            success: true,
            BonesID: bonesID,
            SavGz: `${(Uint8Array.from(bones.SavGz).byteLength / 1000)} KB`,
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

const updateBonesStats = async (req, res) => {
    var catchMessage = '';
    try {
        const {
            BonesID,
            OAID,
        } = req.params

        const newSaveBonesJSON = req.body;

        catchMessage = `Failed to find Bones: ${BonesID}`;
        const bones = await Bones.findByPk(BonesID);

        catchMessage = `Failed to update SaveBonesJSON: ${BonesID}`;
        bones.update({
            SaveBonesJSON: newSaveBonesJSON
        });
        catchMessage = `Failed to save SaveBonesJSON: ${BonesID}`;
        await bones.save({
            fields: ['SaveBonesJSON']
        });

        catchMessage = `Failed to reload Bones: ${BonesID}`;
        await bones.reload();

        catchMessage = `Failed to report susccess: ${BonesID}`;
        var stats = {
            Encountered: 0,
            Defeated: 0,
            Reclaimed: 0,
        }
        try {

            const {
                Encountered,
                Defeated,
                Reclaimed,
            } = bones.SaveBonesJSON.Stats;

            for (let i = 0; i < Encountered.length; i++) {
                stats.Defeated += Encountered[i].Value;
            }
            for (let i = 0; i < Defeated.length; i++) {
                stats.Encountered += Defeated[i].Value;
            }
            for (let i = 0; i < Reclaimed.length; i++) {
                stats.Reclaimed += Reclaimed[i].Value;
            }
        }
        catch (error) {
            console.log('Failed to aggregate stats:', error.message)
        }

        res.status(200).json({
            success: true,
            BonesID: BonesID,
            Stats: stats,
        });
    }
    catch (error) {
        console.log(`${catchMessage}:`, error.message)
        res.status(500).json({
            success: false,
            message: catchMessage,
            error: error.message
        });
    }
};

const getBonesSaveGz = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bonesInfo = await Bones.findByPk(bonesID);
        if (!bonesInfo)
            return res.status(404).json({
                success: false,
                error: `Bones SavGz not found: ${bonesID}`
            });

        res.status(200)
            .set({ 'Content-Type': 'application/octet-stream' })
            .send(Uint8Array.from(bonesInfo.SavGz));
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error retrieving Bones SavGz: ${bonesID}`,
            error: error.message
        });
    }
};

const checkBonesID = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID;
        const bones = await Bones.findByPk(bonesID);
        if (!bones)
            return res.status(404).json({
                success: false,
                error: `BonesID not found: ${bonesID}`
            });

        res.status(200).json({
            success: true,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error retrieving BonesID: ${bonesID}`,
            error: error.message
        });
    }
};

const getAllBonesIDs = async (req, res) => {
    try {
        const bonesInfoIDs = await Bones.findAll({
            attributes: ['ID'],
            where: {
                SavGz: { [Op.not]: null },
            },
        });
        if (!bonesInfoIDs
            || bonesInfoIDs.length == 0)
            return res.status(204).json({
                success: true,
                message: 'No BonesIDs, but no errors'
            });

        let bonesIDs = new Array();
        for (let i = 0; i < bonesInfoIDs.length; i++) {
            bonesIDs[i] = bonesInfoIDs[i].ID;
        }

        res.status(200).json({
            success: true,
            data: bonesIDs,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving All BonesIDs',
            error: error.message
        });
    }
};

const deleteBones = async (req, res) => {
    var bonesID = req.params.BonesID;
    var any = false;
    var errors = new Array();
    try {
        await Bones.destroy({
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
            message: `Error deleting bones with BonesID ${bonesID}`,
            error: error.message
        });
    }

    var message = `No bones with with BonesID: ${bonesID}`;
    if (any)
        message = `Deleted bones with BonesID: ${bonesID}`;

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
        const bonesInfos = await Bones.findAll();

        noInfos = !bonesInfos
            || bonesInfos.length == 0;
        
        if (!noInfos) {
            for (let i = 0; i < bonesInfos.length; i++) {
                let bonesInfo = bonesInfos[i];
                try {
                    await Bones.destroy({
                        where: {
                            ID: bonesInfo.ID
                        }
                    });
                    any = true;
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: 'Error deleting BonesInfo: ' + bonesInfo.ID,
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
        const invalidBonesIDs = await Bones.findAll({
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
                    await Bones.destroy({
                        where: {
                            ID: bonesID,
                        },
                    });
                    fragments++;
                }
                catch (error) {
                    console.log(`Error tidying BonesInfo (${bonesID}) with null SavGz`, error.message);
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
    updateBonesStats,
    getBonesSaveGz,
    checkBonesID,
    getAllBonesIDs,
    deleteBones,
    deleteAllBones,
    tidyBones,
};