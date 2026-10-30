const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { uploadTokenRecords, clearUploadToken } = require('../Common/Middlewares/IsPendingUpload');
const { Bones } = require('../Common/Models/Bones');
const { User } = require('../Common/Models/User');
const { statusTypes, accessLevels } = User
const { BonesSpec } = require('../Common/Models/BonesSpec');
const { BonesStats } = require('../Common/Models/BonesStats');
const { ModConfig } = require('../Common/Models/ModConfig');

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

module.exports.createBones = async (req, res) => {
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
            UserID,
            SaveBonesJSON,
            BonesSpec,
            BonesStats,
            ModConfig,
        } = req.body;

        var bones = null;
        var spec = null;

        try {
            catchMessage = `Failed while checking existing Bones: ${BonesID}`;
            bones = await Bones.unscoped().findOne({
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
                UserID: UserID,
                SaveBonesJSON: SaveBonesJSON,
                BonesSpec: BonesSpec,
                Stats: BonesStats,
                ModConfig: ModConfig,
            },
            {
                include: [
                    bones.BonesSpec,
                    bones.Stats,
                    bones.ModConfig,
                ],
            });
        }
        else {
            if (bones.UserID != UserID) {
                logger.warn({
                    message: `Bones user [${bones.UserID}] being overwritten by [${UserID}]`,
                });
            }
            catchMessage = `Failed to update Bones: ${BonesID}`;
            bones.update({
                ID: BonesID,
                UserID: UserID,
                SaveBonesJSON: SaveBonesJSON,
                BonesSpec: BonesSpec,
                Stats: BonesStats,
                ModConfig: ModConfig,
                SavGz: null,
            },
            {
                include: [
                    bones.BonesSpec,
                    bones.Stats,
                    bones.ModConfig,
                ],
            });

            catchMessage = `Failed to save Bones: ${BonesID}`;
            await bones.save({
                fields: ['BonesID', 'SaveBonesJSON', 'BonesSpec', 'Stats', 'SavGz']
            });

            catchMessage = `Failed to reload Bones: ${BonesID}`;
            await bones.reload();
        }

        if (!bones) {
            throw new Error('null Bones after creation/update');
        }

        res.status(201).json({
            success: req.basicToken,
            BonesID: BonesID,
            BonesInfo: bones.SaveBonesJSON,
            BonesSpec: bones.BonesSpec,
            BonesStats: bones.Stats,
            BonesSpec: bones.ModConfig,
            SavGz: {
                Size: `${bones.Size/1000} KB`,
                Data: 'to be PUT directly',
            },
            Uploaded: updatedAt,
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

module.exports.addBonesSavGz = async (req, res) => {
    var catchMessage = '';
    var bonesID;
    try {
        bonesID = uploadTokenRecords[req.basicToken].BonesID;

        catchMessage = `Failed to find Bones: ${bonesID}`;
        var bones = await Bones.unscoped().findByPk(bonesID);

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

        var result = {
            BonesID: bonesID,
            SavGz: `${(Uint8Array.from(bones.SavGz).byteLength / 1000)} KB`,
        };
        logger.info({
            success: true,
            result: result,
        })
        res.status(201).json(result);
        clearUploadToken(req.basicToken);
    }
    catch (error) {
        logger.error(catchMessage, error.message);
        res.status(500).json({
            message: catchMessage,
            error: error.message
        });
    }
};

module.exports.updateBonesStats = async (req, res) => {
    var catchMessage = '';
    try {
        const {
            Stat,
            BonesID,
            UserID,
        } = req.params

        if (!Stat) {
            var output = {
                error: `No stat provided`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        let lastEncountered;
        const isEncountered = Stat == 'Encountered'
        if (isEncountered) {
            lastEncountered = BigInt(new Date() + 621355968000000000n) * 1000n;
        }

        catchMessage = `Failed to find User: ${UserID}`;
        const user = await User.findByPk(UserID);

        if (!user) {
            var output = {
                error: `User not found: ${UserID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        catchMessage = `Failed to find Bones: ${BonesID}`;
        const bones = await Bones.findByPk(BonesID);

        if (!bones) {
            var output = {
                error: `Bones Info not found: ${BonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        const saveBonesJson = bones.SaveBonesJSON;
        const storedStats = saveBonesJson.Stats

        if (!Object.keys(storedStats).includes(Stat)) {
            var output = {
                error: `Stat is not a tracked stat: ${Stat}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        var storedStat = storedStats[Stat];

        catchMessage = `Failed to increment stat ${Stat} for ${UserID}`;
        let incremented = false;
        for (let i = 0; i < storedStat.length; i++) {
            if (storedStat[i].UserID == user.ID) {
                storedStat[i].Value += 1;
                incremented = true;
                break;
            }
        }
        catchMessage = `Failed to add stat ${Stat} for ${UserID}`;
        if (!incremented) {
            storedStat.push({
                UserID: user.ID,
                Value: 1,
            })
            incremented = true;
        }

        catchMessage = `Failed to update LastEncountered`;
        if (isEncountered) {
            storedStats['LastEncountered'] = lastEncountered;
        }

        saveBonesJson.Stats = storedStats

        catchMessage = `Failed to update SaveBonesJSON: ${BonesID}`;
        bones.update({
            SaveBonesJSON: saveBonesJson
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
            } = saveBonesJson.Stats;

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

module.exports.getBonesSaveGz = async (req, res) => {
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

module.exports.checkBonesID = async (req, res) => {
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

module.exports.getAllBonesIDs = async (req, res) => {
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

module.exports.deleteBones = async (req, res) => {
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

module.exports.deleteAllBones = async (req, res) => {
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

module.exports.tidyBones = async () => {
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

module.exports.checkBonesInfo = async (req, res) => {
    try {
        res.status(200).json((await Bones.findByPk(req.params.BonesID)) != null);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Info: ${BonesID}`,
            error: error.message
        });
    }
};

module.exports.getAllReports = async (req, res) => {
    try {
        const {
            UserID,
            BonesID
        } = req.params;

        var condition = {};

        if (UserID) {
            condition.UserID = UserID;
        }
        if (BonesID) {
            condition.BonesID = BonesID;
        }

        var reportsRaw = null;
        if (UserID
            || BonesID) {
            reportsRaw = await Report.findAll({
                where: condition,
                order: [
                    ['createdAt', 'DESC']
                ],
            });
        }
        else {
            reportsRaw = await Report.findAll({
                order: [
                    ['createdAt', 'DESC']
                ],
            });
        }
        const reports = reportsRaw;

        if ((reports?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Reports, but no errors'
            });
            return;
        }

        res.status(200).json(reports);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All Reports',
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

module.exports.deleteAllReports = async (req, res) => {
    var deleteCount = 0;
    var errors = {};
    var errorCount = 0;
    try {
        const {
            UserID,
            BonesID
        } = req.params;

        var condition = {};

        if (UserID) {
            condition.UserID = UserID;
        }
        if (BonesID) {
            condition.BonesID = BonesID;
        }

        var reportsRaw = null;
        if (UserID
            || BonesID) {
            reportsRaw = await Report.findAll({
                where: condition,
            });
        }
        else {
            reportsRaw = await Report.findAll();
        }
        const reports = reportsRaw;

        if ((reports?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Reports, but no errors'
            });
            return;
        }

        for (let i = 0; i < reports.length; i++) {
            let report = reports[i];
            try {
                await Report.destroy({
                    where: {
                        ID: report.ID
                    }
                });
            }
            catch (error) {
                let errorIndex = errorCount++;
                errors[errorIndex].reportID = report.ID;
                errors[errorIndex].error = error.message;
            }
        }
    }
    catch (error) {
        var output = {
            message: 'Error deleting All Reports',
            error: error.message,
            reportErrors: errors,
        }
        logger.error(output);
        res.status(500).json(output);
    }

    var message = `Deleted all Reports`;

    if (BonesID) {
        message += `, BonesID: ${BonesID}`;
    }
    if (UserID) {
        message += `, UserID: ${UserID}`;
    }
    var output = {
        deleted: deleteCount,
        message: message,
        reportErrors: errors,
    };
    logger.info(output);
    res.status(200).json(output);
};

module.exports.getBonesInfo = async (req, res) => {
    try {
        var {
            BonesID,
            UserID,
        } = req.params

        var userID = req.token?.user?.UserID || UserID;

        const bones = await Bones.findByPk(BonesID);
        if (!bones) {
            var output = {
                error: `Bones Info not found: ${BonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        const bonesJSON = bones.SaveBonesJSON;

        bonesJSON.IsYou = userID
            && Bones.UserID != userID;

        var user;
        if (userID) {
            user = Bones.User;
        }

        let wantSanitizeStats = !user
            || accessLevels[user.Access] < accessLevels['Manage'];

        bonesJSON.Stats = wantSanitizeStats
            ? Bones.Stats.sanitizedStats(userID)
            : Bones.Stats
            ;

        bonesJSON.BonesSpec = Bones.BonesSpec;
        bonesJSON.EnabledMods = Bones.ModConfig;

        res.status(200).json(bonesJSON);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Info: ${BonesID}`,
            error: error.message
        });
    }
};

module.exports.getAllBonesInfo = async (req, res) => {
    try {
        var {
            from,
            to,
        } = req.params;

        var userID = req.token?.user?.UserID || req.params.UserID;

        if (!to) {
            from = 0;
            to = 0;
        }

        if (from > to) {
            [from, to] = [to, from];
        }

        var offset = from;
        var limit = Math.max(0, from - to);

        if (limit === 0) {
            limit = null;
        }

        var constraints = {
            SavGz: { [Op.not]: null },
        };

        if (req.body?.BonesIDs) {
            constraints.ID = { [Op.or]: req.body.BonesIDs }
        }

        const allBonesInfos = await Bones.findAll({
            attributes: { exclude: ['ID', 'Size', 'SavGz'] },
            where: constraints,
            order: [
                ['createdAt', 'DESC']
            ],
            offset: offset,
            limit: limit,
        });
        if ((allBonesInfos?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Bones, but no errors'
            });
            return;
        }

        const statLabels = [
            'Encountered',
            'Defeated',
            'Reclaimed',
            'Broken',
        ]

        var user;
        if (userID) {
            user = await User.findByPk(userID);
        }

        let wantSanitizeStats = !user
            || accessLevels[user.Access] < accessLevels['Manage'];

        let bonesJSONs = new Array();
        for (let i = 0; i < allBonesInfos.length; i++) {
            let bones = allBonesInfos[i];
            let bonesJSON = bones.SaveBonesJSON;
            bonesJSON.IsYou = userID
                && bones.UserID == userID;

            bonesJSON.Stats = wantSanitizeStats
                ? bones.Stats.sanitizedStats(userID)
                : bones.Stats
                ;

            bonesJSON.BonesSpec = bones.BonesSpec;
            bonesJSON.EnabledMods = bones.ModConfig;

            bonesJSONs[i] = bonesJSON;
        }
        logger.info(`sending response`);
        res.status(200).json(bonesJSONs);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving All BonesInfos`,
            error: error.message
        });
    }
};

module.exports.getBonesSpec = async (req, res) => {
    var bonesID;
    try {
        bonesID = req.params.BonesID
        const bonesSpec = await BonesSpec.findByPk(bonesID);
        if (!bonesSpec) {
            var output = {
                error: `Bones Spec not found: ${bonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(bonesSpec);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Spec: ${bonesID}`,
            error: error.message
        });
    }
};

module.exports.getAllBonesSpecs = async (req, res) => {
    try {
        const bonesSpecs = await BonesSpec.findAll({
            where: {
                Bones: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((bonesSpecs?.length || 0) == 0) {
            res.status(204).json({
                message: 'No BonesSpecs, but no errors'
            });
            return;
        }

        res.status(200).json(bonesSpecs);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All BonesSpecs',
            error: error.message
        }
        logger.error(output);
        res.status(500).json(output);
    }
};

module.exports.getBonesIDsMatchingSpec = async (req, res) => {
    try {
        const playerSpec = BonesSpec.wildcardSpec(req.query);

        const bonesSpecs = await BonesSpec.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((bonesSpecs?.length || 0) == 0) {
            res.status(204).json({
                message: 'No BonesSpecs, but no errors'
            });
            return;
        }

        if (!playerSpec) {
            return res.status(200).json(bonesSpecs);
        }

        var matchingBonesSpecs = new Array();
        for (let i = 0; i < bonesSpecs.length; i++) {
            if (bonesSpecs[i].isWithinSpec(playerSpec)) {
                matchingBonesSpecs[matchingBonesSpecs.length] = bonesSpecs[i].BonesID;
            }
        }
        res.status(200).json(matchingBonesSpecs);
    }
    catch (error) {
        var output = {
            message: `Error retrieving BonesSpecs matching PlayerSpec: ${playerSpec}`,
            error: error.message
        }
        logger.error(output);
        res.status(500).json(output);
    }
};


module.exports.getBonesStats = async (req, res) => {
    try {
        var {
            BonesID,
            UserID,
        } = req.params;

        UserID ??= req.token?.user?.UserID;

        const bonesStats = await BonesStats.findByPk(BonesID);
        if (!bonesStats) {
            var output = {
                error: `Bones Stats not found: ${BonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        var user;
        if (UserID) {
            user = await User.findByPk(UserID);
        }

        let wantSanitizeStats = !user
            || user.Access != 'Manage';

        var stats = wantSanitizeStats
            ? bonesStats.sanitizedStats(user.ID)
            : bonesStats
            ;

        res.status(200).json(stats);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Bones Stats: ${BonesID}`,
            error: error.message
        });
    }
};

module.exports.getAllBonesStats = async (req, res) => {
    try {
        var {
            UserID,
        } = req.params;

        UserID ??= req.token?.user?.UserID;

        const bonesStats = await BonesStats.findAll({
            where: {
                Bones: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((bonesStats?.length || 0) == 0) {
            res.status(204).json({
                message: 'No BonesStats, but no errors'
            });
            return;
        }

        var user;
        if (UserID) {
            user = await User.findByPk(UserID);
        }

        let wantSanitizeStats = !user
            || user.Access != 'Manage';

        var stats = new Array();

        for (let i = 0; i < bonesStats.length; i++) {
            stats[i] = wantSanitizeStats
                ? bonesStats[i].sanitizedStats(user.ID)
                : bonesStats[i]
                ;
        }

        res.status(200).json(stats);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All BonesStats',
            error: error.message
        }
        logger.error(output);
        res.status(500).json(output);
    }
};

module.exports.updateBonesStats = async (req, res) => {
    var catchMessage = '';
    try {
        const {
            Stat,
            BonesID,
            UserID,
        } = req.params

        if (!Stat) {
            var output = {
                error: `No stat provided`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        let lastEncountered;
        const isEncountered = Stat == 'Encountered'
        if (isEncountered) {
            lastEncountered = BigInt(new Date() + 621355968000000000n) * 1000n;
        }

        catchMessage = `Failed to find User: ${UserID}`;
        const user = await User.findByPk(UserID);

        if (!user) {
            var output = {
                error: `User not found: ${UserID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        catchMessage = `Failed to find Bones: ${BonesID}`;
        const bones = await Bones.findByPk(BonesID);

        if (!bones) {
            var output = {
                error: `Bones Info not found: ${BonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        const saveBonesJson = bones.SaveBonesJSON;
        const storedStats = saveBonesJson.Stats

        if (!Object.keys(storedStats).includes(Stat)) {
            var output = {
                error: `Stat is not a tracked stat: ${Stat}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        var storedStat = storedStats[Stat];

        catchMessage = `Failed to increment stat ${Stat} for ${UserID}`;
        let incremented = false;
        for (let i = 0; i < storedStat.length; i++) {
            if (storedStat[i].UserID == user.ID) {
                storedStat[i].Value += 1;
                incremented = true;
                break;
            }
        }
        catchMessage = `Failed to add stat ${Stat} for ${UserID}`;
        if (!incremented) {
            storedStat.push({
                UserID: user.ID,
                Value: 1,
            })
            incremented = true;
        }

        catchMessage = `Failed to update LastEncountered`;
        if (isEncountered) {
            storedStats['LastEncountered'] = lastEncountered;
        }

        saveBonesJson.Stats = storedStats

        catchMessage = `Failed to update SaveBonesJSON: ${BonesID}`;
        bones.update({
            SaveBonesJSON: saveBonesJson
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
            } = saveBonesJson.Stats;

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


module.exports.getModConfig = async (req, res) => {
    try {
        var {
            BonesID,
        } = req.params;

        const modConfig = await ModConfig.findByPk(BonesID);
        if (!modConfig) {
            var output = {
                error: `ModConfig not found: ${BonesID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }

        res.status(200).json(modConfig);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving ModConfig: ${BonesID}`,
            error: error.message
        });
    }
};

module.exports.getAllModConfigs = async (req, res) => {
    try {
        const modConfigs = await ModConfig.findAll({
            where: {
                Bones: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });

        if ((modConfigs?.length || 0) == 0) {
            res.status(204).json({
                message: 'No ModConfigs, but no errors'
            });
            return;
        }

        res.status(200).json(modConfigs);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All ModConfigs',
            error: error.message
        }
        logger.error(output);
        res.status(500).json(output);
    }
};


module.exports.getModConfigsMatchingSpec = async (req, res) => {
    try {
        const playerSpec = BonesSpec.wildcardSpec(req.query);

        const bonesSpecs = await BonesSpec.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((bonesSpecs?.length || 0) == 0) {
            res.status(204).json({
                message: 'No BonesSpecs, but no errors'
            });
            return;
        }

        if (!playerSpec) {
            return res.status(200).json(bonesSpecs);
        }

        var matchingBonesSpecs = new Array();
        for (let i = 0; i < bonesSpecs.length; i++) {
            if (bonesSpecs[i].isWithinSpec(playerSpec)) {
                matchingBonesSpecs[matchingBonesSpecs.length] = bonesSpecs[i].BonesID; // THIS NEEDS TO BE CHANGED TO MOD CONFIG
            }
        }

        var constraints = {
            Bones: { [Op.not]: null },
        };

        if (matchingBonesSpecs) {
            constraints.ID = { [Op.or]: matchingBonesSpecs }
        }

        const modConfigs = await ModConfig.findAll({
            where: constraints,
            order: [
                ['createdAt', 'DESC']
            ],
        })

        if ((modConfigs?.length || 0) == 0) {
            res.status(204).json({
                message: 'No ModConfigs, but no errors'
            });
            return;
        }

        res.status(200).json(modConfigs);
    }
    catch (error) {
        var output = {
            message: `Error retrieving BonesSpecs matching PlayerSpec: ${playerSpec}`,
            error: error.message
        }
        logger.error(output);
        res.status(500).json(output);
    }
};