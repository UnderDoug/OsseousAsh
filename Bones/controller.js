const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { tokenRecords, clearToken } = require('../Common/Middlewares/IsAllowedToPutSavGz');
const { Bones } = require('../Common/Models/Bones');

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

    var catchMessage = "Top of the run";
    try {
        const {
            BonesID,
            SaveBonesJSON,
        } = req.body;

        var bones = null;

        try {
            catchMessage = `Failed while checking existing Bones: ${BonesID}`;
            bones = await Bones.findOne({
                where: {
                    ID: BonesID,
                },
            });
        }
        catch (error) {
            logger.warn({
                message: catchMessage,
                error: error.message
            });
        }

        if (!bones) {
            catchMessage = `Failed to create Bones: ${BonesID}`;
            bones = await Bones.create({
                ID: BonesID,
                SaveBonesJSON: SaveBonesJSON,
            });
        }
        else {
            catchMessage = `Failed to update Bones: ${BonesID}`;

            bones.update({
                ID: BonesID,
                SaveBonesJSON: SaveBonesJSON,
                SavGz: null,
            });

            catchMessage = `Failed to save Bones: ${BonesID}`;
            await bones.save({
                fields: ['BonesID', 'SaveBonesJSON', 'SavGz']
            });

            catchMessage = `Failed to reload Bones: ${BonesID}`;
            await bones.reload();
        }

        if (!bones) {
            throw new Error('null Bones after creation/update');
        }

        res.status(201).json({
            success: req.token,
            BonesID: BonesID,
            BonesInfo: bones.SaveBonesJSON,
            SavGz: {
                Size: `${bones.Size/1000} KB`,
                Data: 'to be PUT directly',
            },
            Uploaded: bones.createdAt,
        });
    }
    catch (error) {
        var output = {
            message: catchMessage,
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
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
            BonesID: bonesID,
            SavGz: `${(Uint8Array.from(bones.SavGz).byteLength / 1000)} KB`,
        });
        clearToken(req.token);
    }
    catch (error) {
        logger.error(catchMessage, error.message);
        res.status(500).json({
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

        if (!bones) {
            var output = {
                error: `Bones Info not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

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
            LastEncountered: 'null',
            Encountered: 0,
            Defeated: 0,
            Reclaimed: 0,
            Broken: 0,
        };
        var caughtEx = null;
        try {
            catchMessage = `Failed to extract Stats`;
            const {
                LastEncountered,
                Encountered,
                Defeated,
                Reclaimed,
                Broken,
            } = newSaveBonesJSON.Stats;

            if (LastEncountered > 0) {
                catchMessage = `Failed to make Date`;
                let t = (BigInt(LastEncountered) - 621355968000000000n) / 10000n;
                let d = new Date(Number(t));
                stats.LastEncountered = d.toISOString();
            }
            if (Encountered) {
                catchMessage = `Failed to increment Encountered`;
                for (let i = 0; i < Encountered.length; i++) {
                    stats.Encountered += Encountered[i].Value;
                }
            }
            if (Defeated) {
                catchMessage = `Failed to increment Defeated`;
                for (let i = 0; i < Defeated.length; i++) {
                    stats.Defeated += Defeated[i].Value;
                }
            }
            if (Reclaimed) {
                catchMessage = `Failed to increment Reclaimed`;
                for (let i = 0; i < Reclaimed.length; i++) {
                    stats.Reclaimed += Reclaimed[i].Value;
                }
            }
            if (Broken) {
                catchMessage = `Failed to increment Broken`;
                for (let i = 0; i < Broken.length; i++) {
                    stats.Broken += Broken[i].Value;
                }
            }
        }
        catch (error) {
            console.log('Failed to aggregate stats:', error.message);
            caughtEx = {
                error: `Failed to aggregate stats: ${error}`,
                catch: catchMessage,
            };
        }

        var output = {
            BonesID: BonesID,
            Stats: stats,
        };
        if (caughtEx) {
            output.info = caughtEx;
        }

        res.status(200).json(output);
    }
    catch (error) {
        var output = {
            message: catchMessage,
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

const getBonesSaveGz = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bonesInfo = await Bones.findByPk(bonesID);
        if (!bonesInfo) {
            var output = {
                error: `Bones SavGz not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200)
            .set({ 'Content-Type': 'application/octet-stream' })
            .send(Uint8Array.from(bonesInfo.SavGz));
    }
    catch (error) {
        var output = {
            message: `Error retrieving Bones SavGz: ${bonesID}`,
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

const postDownloadBones = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID
        const bones = await Bones.findOne({
            where: {
                ID: bonesID,
                SavGz: { [Op.not]: null },
            },
        });

        if (!bones) {
            var output = {
                error: `Bones not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json({
            success: true,
            SaveBonesJSON: bones.SaveBonesJSON,
            SavGz: Uint8Array.from(bones.SavGz),
        });
    }
    catch (error) {
        var output = {
            message: `Error retrieving Bones for download: ${bonesID}`,
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

const checkBonesID = async (req, res) => {
    let bonesID;
    try {
        bonesID = req.params.BonesID;
        const bones = await Bones.findByPk(bonesID);
        if (!bones) {
            var output = {
                error: `BonesID not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json({
            success: true,
        });
    }
    catch (error) {
        var output = {
            message: `Error retrieving BonesID: ${bonesID}`,
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

const getAllBonesIDs = async (req, res) => {
    try {
        const bonesInfoIDs = await Bones.findAll({
            attributes: ['ID'],
            where: {
                SavGz: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if (!bonesInfoIDs
            || bonesInfoIDs.length == 0) {
            var output = {
                message: 'No BonesIDs, but no errors'
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        let bonesIDs = new Array();
        for (let i = 0; i < bonesInfoIDs.length; i++) {
            bonesIDs[i] = bonesInfoIDs[i].ID;
        }

        res.status(200).json(bonesIDs);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All BonesIDs',
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
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
        var output = {
            message: `Error deleting bones with BonesID ${bonesID}`,
            error: error.message
        };
        logger.warn(output);
        res.status(500).json(output);
    }

    var message = `No bones with with BonesID: ${bonesID}`;
    if (any)
        message = `Deleted bones with BonesID: ${bonesID}`;

    res.status(200).json({
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
                    var output = {
                        success: false,
                        message: 'Error deleting BonesInfo: ' + bonesInfo.ID,
                        error: error.message
                    };
                    logger.error(output);
                    res.status(500).json(output);
                }
            }
        }
    }
    catch (error) {
        var output = {
            message: 'Error deleting Bones',
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }

    if (!any) {
        res.status(204).json({
            message: 'No Bones, but no errors'
        });
        return;
    }

    res.status(200).json({
        message: 'Deleted all Bones'
    });
};

const tidyBones = async () => {
    logger.info('Tidying bone fragments...');
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
                    logger.error(`Error tidying BonesInfo (${bonesID}) with null SavGz`, error.message);
                }
            }
        }
    }
    catch (error) {
        logger.error('Error tidying Bones', error.message);
    }
    logger.info(fragments + ' bone fragments tidied!');
}

module.exports = {
    createBones,
    addBonesSavGz,
    updateBonesStats,
    getBonesSaveGz,
    postDownloadBones,
    checkBonesID,
    getAllBonesIDs,
    deleteBones,
    deleteAllBones,
    tidyBones,
};