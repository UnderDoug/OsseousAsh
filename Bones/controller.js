const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { uploadTokenRecords, clearUploadToken } = require('../Common/Middlewares/IsPendingUpload');
const {
    User,
    Bones,
    Report,
    BonesSpec,
    BonesStats,
    StatCategory,
    BonesStatsCategory,
    BonesStatsCategoryEntry,
    ModConfig,
    ModRecord,
    ModConfigRecord,
} = require('../Common/models');
const { statusTypes, accessLevels } = User;

/*const bonesOutputFullModConfigInclude = [
    {
        association: 'BonesSpec',
        required: true,
    },
    {
        association: 'BonesStats',
        required: true,
    },
    {
        association: 'ModConfig',
        include: ModConfig.forOutputFullInclude,
        required: true,
    },
];*/

const bonesOutputInclude = [
    {
        association: 'BonesSpec',
        required: true,
    },
    {
        association: 'BonesStats',
        required: true,
    },
    {
        association: 'ModConfig',
        include: ModConfig.forOutputCleanInclude,
        required: true,
    },
];

/*const bonesOutputOptions = {
    include: bonesOutputFullModConfigInclude,
}*/

/*const bonesCreateInclude = [
    {
        association: Bones.BonesSpec,
        required: true,
    },
    {
        association: Bones.BonesStats,
        required: true,
    },
    {
        association: Bones.ModConfig,
        required: true,
    },
];*/

/*const bonesCreateOptions = {
    include: bonesCreateInclude,
}*/

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
    var catchMessage = 'Top of the run';
    try {
        const rb = req.body;

        // console.log(JSON.stringify(rb, null, 4));

        const userID = rb.UserID || req.user?.ID;
        const userHandle = rb.SaveBonesJSON && rb.SaveBonesJSON.Handle;
        console.log(JSON.stringify({ userID: userID, userHandle: userHandle }, null, 4));
                
        catchMessage = `createBones findOrCreate User: ${userID}`;
        const [user, userCreated] = await User.unscoped().findOrCreate({
            where: {
                ID: userID,
            },
            defaults: {
                Handle: userHandle,
            },
            attributes: { exclude: User.privateExclIDFields },
            include: [
                {
                    association: User.Bones,
                    required: false,
                },
            ],
        });

        catchMessage = `createBones after findOrCreate User: ${userID}`;

        if (!user) {
            throw new Error(`Failed to create or find user ${userID}`);
        }

        catchMessage = `createBones findOrCreate Bones: ${rb.BonesID}`;
        var [bones, bonesCreated] = await Bones.scope(Bones.forCreateScope).findOrCreate({
            where: {
                ID: rb.BonesID,
            },
            defaults: {
                SaveBonesJSON: rb.SaveBonesJSON,
                UserID: user.ID,
            },
        });

        const updated = false;
        if (!bonesCreated) {
            try {
                if (bones.UserID != userID) {
                    logger.warn(`createBones Bones [${rb.BonesID}] being overwritten by user [${userID}]`);
                }
                catchMessage = `createBones bonesFound Bones (associative update): ${rb.BonesID}`;
                try {
                    catchMessage = `createBones bonesFound BonesSpec.destroy: ${rb.BonesID}`;
                    await bones.BonesSpec.destroy();
                    catchMessage = `createBones bonesFound BonesStats.destroy: ${rb.BonesID}`;
                    await bones.BonesStats.destroy();
                    catchMessage = `createBones bonesFound ModConfig.destroy: ${rb.BonesID}`;
                    await bones.ModConfig.destroy();
                    await bones.update({
                        ID: rb.BonesID,
                        SaveBonesJSON: rb.SaveBonesJSON,
                        SavGz: null,
                        UserID: user.ID,
                    });
                    updated = true;
                }
                catch (err) {
                    catchMessage += `; caught!`
                    logger.warn(`${catchMessage} with forCreateModConfigFullScope; ${JSON.stringify(err, null, 4)}`);
                    updated = false;
                }

                if (updated
                    && bones) {
                    await bones.reload();
                    logger.info('Updated Bones');
                }
            }
            catch (err) {
                catchMessage += `; caught!`
                logger.warn(`${catchMessage}; ${JSON.stringify(err, null, 4)}`);
            }
        }

        var bonesSpec = bones.BonesSpec;
        // BonesSpec
        try {
            if (!bonesSpec) {
                catchMessage = `createBones bonesCreated BonesSpec: ${rb.BonesID}`;
                bonesSpec = await bones.createBonesSpec(rb.BonesSpec);
                await bones.reload();
            }
        }
        catch (err) {
            catchMessage += `; caught!`
            logger.warn(`${catchMessage} ${JSON.stringify(err, null, 4)}`);
        }

        var bonesStats = bones.BonesStats;
        // BonesStats
        try {
            if (!bonesStats) {
                catchMessage = `createBones bonesCreated BonesStats: ${rb.BonesID}`;
                bonesStats = await bones.createBonesStats(rb.BonesStats);
                await bones.reload();
            }
            var rbStats = rb.BonesStats.Stats;
            const statLabels = Object.keys(rbStats);
            for (let i = 0; i < statLabels.length; i++) {
                let statLabel = statLabels[i];
                catchMessage = `createBones findOrCreate statLabel '${statLabel}': ${rb.BonesID}`;
                try {
                    let [statCategory, created] = await StatCategory.findOrCreate({
                        where: {
                            Name: statLabel,
                        },
                    });
                    if (created) {
                        logger.info(`new StatCategory '${statLabel}' added by User [${userID}]`);
                    }
                    if (statCategory) {
                        catchMessage = `createBones bonesStats.addStat '${statLabel}': ${rb.BonesID}`;
                        let rbEntries = rbStats[statLabel];
                        console.log(JSON.stringify({ Key: statLabel, Value: rbEntries }, null, 4));
                        let through = {};
                        if (rbEntries) {
                            through = { through: { Entries: rbEntries }, };
                        }
                        let bonesStatsCategory = await bonesStats.addCategory(statCategory, through);
                        console.log(JSON.stringify({ bonesStatsCategory: bonesStatsCategory }, null, 4));
                    }
                }
                catch (err) {
                    logger.warn(`${catchMessage}; ${err.message}`);
                }
            }
        }
        catch (err) {
            catchMessage += `; caught!`
            logger.warn(`${catchMessage} ${JSON.stringify(err, null, 4)}`);
        }

        var modConfig = bones.ModConfig;
        // ModConfig
        try {
            if (!modConfig) {
                catchMessage = `createBones bonesCreated ModConfig: ${rb.BonesID}`;
                modConfig = await bones.createModConfig(rb.ModConfig);
                await bones.reload();
            }

            if (modConfig.Records?.length != rb.ModConfig.Records.length) {
                const modRecords = [];
                for (let i = 0; i < rb.ModConfig.Records.length; i++) {
                    record = rb.ModConfig.Records[i];
                    try {
                        let version = record.Version || '0.0.0';
                        catchMessage = `createBones findOrCreate record[${i}] [${record.ID}, ${record.Version}]`;
                        let [modRecord, created] = await ModRecord.findOrCreate({
                            attributes: ['Index', 'ID', 'Version', 'Title'],
                            where: {
                                ID: record.ID,
                                Version: version
                            },
                            defaults: {
                                Title: record.Title,
                            }
                        });

                        catchMessage = `createBones modConfig.createRecord[${i}] [${record.ID}, ${record.Version}]`;
                        await modConfig.addRecord(modRecord);
                    }
                    catch (err) {
                        logger.warn(`${catchMessage}; ${err.message}`);
                    }
                }
            }
        }
        catch (err) {
            catchMessage += `; caught!`
            logger.warn(`${catchMessage} ${JSON.stringify(err, null, 4)}`);
        }

        if (!bones) {
            throw new Error('null Bones after creation/update');
        }

        catchMessage = `createBones bones.setUser: ${rb.BonesID}`;
        await bones.setUser(user);

        catchMessage = `createBones reload Bones: ${rb.BonesID}`;
        await bones.reload({
            include: Bones.forOutputCleanInclude,
        });

        catchMessage = `createBones user.addBones: ${rb.BonesID}`;
        // await user.addBone(bones);

        catchMessage = `sending response`;
        const output = {
            UploadToken: req.basicToken,
            BonesID: rb.BonesID,
            UserID: bones.UserID,
            BonesInfo: bones.SaveBonesJSON,
            BonesSpec: bones.get('BonesSpec', { plain: true }),
            BonesStats: bones.get('BonesStats', { plain: true }),
            ModConfig: bones.get('ModConfig', { plain: true }),
            SavGz: {
                Size: `${formatBytes(bones.Size)}`,
                Data: 'to be PUT directly',
            },
            Uploaded: bones.updatedAt,
        };
        logger.info(JSON.stringify(output, null, 4));
        res.status(201).json(output);
    }
    catch (error) {
        var output = {
            message: catchMessage,
            error: error.message
        };
        logger.error(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};

const formatBytes = (bytes) => {
    var suffix = ['B', 'KB', 'MB', 'GB', 'TB'];
    var bytesValue = bytes;
    for (var i = 0; i < suffix.Length && bytes >= 1000; i++, bytes /= 1000)
        bytesValue = bytes / 1000.0;

    return `${bytesValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${suffix[i]}`;
}

module.exports.addBonesSavGz = async (req, res) => {
    var catchMessage = 'Top of the run';
    try {
        const bonesID = uploadTokenRecords[req.basicToken].BonesID;
        const savGz = req.body;

        logger.info(`addBonesSavGz: ${bonesID}`);

        catchMessage = `addBonesSavGz Failed to find Bones: ${bonesID}`;
        var bones = await Bones.unscoped().findByPk(bonesID);

        catchMessage = `addBonesSavGz Failed to update Bones SavGz: ${bonesID}`;
        bones.update({
            SavGz: savGz,
        });
        /*catchMessage = `Failed to save Bones SavGz: ${bonesID}`;
        await bones.save({
            fields: ['SavGz']
        });*/

        catchMessage = `addBonesSavGz Failed to reload Bones: ${bonesID}`;
        await bones.reload();

        catchMessage = `addBonesSavGz Failed to get size: ${bonesID}`;
        var result = {
            BonesID: bonesID,
            SavGz: `${formatBytes(Uint8Array.from(savGz).byteLength)}`,
        };

        catchMessage = `addBonesSavGz Failed to log info: ${bonesID}`;
        logger.info(JSON.stringify({
            method: 'addBonesSavGz',
            success: true,
            result: result,
        }), null, 4);

        try {
            catchMessage = `addBonesSavGz Failed to clearUploadToken: ${req.basicToken}`;
            clearUploadToken(req.basicToken);
        }
        catch (err) {
            logger.warn(`${catchMessage}: ${err.message}`);
        }
        res.status(201).json(result);
    }
    catch (error) {
        logger.error(JSON.stringify({ Message: catchMessage, Error: error.message }, null, 4) );
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
            StatName,
            BonesID,
        } = req.params

        const UserID = req.user.ID;

        if (!StatName) {
            var output = {
                error: `No stat provided`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        let lastEncountered;
        const isEncountered = StatName == 'Encountered'
        if (isEncountered) {
            lastEncountered = BigInt(new Date() + 621355968000000000n) * 1000n;
        }

        catchMessage = `updateBonesStats find User: ${UserID}`;
        const user = await User.findByPk(UserID);

        if (!user) {
            var output = {
                error: `User not found: ${UserID}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        catchMessage = `updateBonesStats find Bones: ${BonesID}`;
        const bonesStats = await BonesStats.findByPk(BonesID);

        if (!bonesStats) {
            var output = {
                error: `Bones Stats not found: ${BonesID}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        const storedStats = bonesStats.Stats

        if (!Object.keys(storedStats).includes(StatName)) {
            var output = {
                error: `Stat is not a tracked stat: ${StatName}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        var storedStat = storedStats[StatName];

        catchMessage = `updateBonesStats increment stat ${StatName} for ${UserID}`;
        let incremented = false;
        for (let i = 0; i < storedStat.length; i++) {
            if (storedStat[i].UserID == user.ID) {
                storedStat[i].Value += 1;
                incremented = true;
                break;
            }
        }
        catchMessage = `updateBonesStats add stat ${StatName} for ${UserID}`;
        if (!incremented) {
            storedStat.push({
                UserID: user.ID,
                Value: 1,
            })
            incremented = true;
        }

        catchMessage = `updateBonesStats update LastEncountered`;
        if (isEncountered) {
            bonesStats.LastEncountered = lastEncountered;
        }

        bonesStats.Stats = storedStats

        catchMessage = `updateBonesStats update SaveBonesJSON: ${BonesID}`;
        bonesStats.update({
            LastEncountered: bonesStats.LastEncountered,
            Stats: storedStats,
        });
        /*catchMessage = `Failed to save SaveBonesJSON: ${BonesID}`;
        await bonesStats.save({
            fields: ['LastEncountered', 'Stats']
        });*/

        catchMessage = `updateBonesStats reload Bones: ${BonesID}`;
        await bonesStats.reload();

        catchMessage = `updateBonesStats report susccess: ${BonesID}`;
        var outputBonesStats = {
            BonesID: BonesID,
            LastEncountered: 'null',
            Stats: {
                Encountered: 0,
                Defeated: 0,
                Reclaimed: 0,
                Broken: 0,
            }
        };
        var caughtEx = {};
        try {
            catchMessage = `updateBonesStats extract Stats`;
            const LastEncountered = bonesStats.LastEncountered;
            const {
                Encountered,
                Defeated,
                Reclaimed,
                Broken,
            } = bonesStats.Stats;

            if (LastEncountered > 0) {
                catchMessage = `updateBonesStats make Date`;
                let t = (BigInt(LastEncountered) - 621355968000000000n) / 10000n;
                let d = new Date(Number(t));
                outputBonesStats.LastEncountered = d.toISOString();
            }
            if (Encountered) {
                catchMessage = `updateBonesStats increment Encountered`;
                for (let i = 0; i < Encountered.length; i++) {
                    outputBonesStats.Stats.Encountered += Encountered[i].Value;
                }
            }
            if (Defeated) {
                catchMessage = `updateBonesStats increment Defeated`;
                for (let i = 0; i < Defeated.length; i++) {
                    outputBonesStats.Stats.Defeated += Defeated[i].Value;
                }
            }
            if (Reclaimed) {
                catchMessage = `updateBonesStats increment Reclaimed`;
                for (let i = 0; i < Reclaimed.length; i++) {
                    outputBonesStats.Stats.Reclaimed += Reclaimed[i].Value;
                }
            }
            if (Broken) {
                catchMessage = `updateBonesStats increment Broken`;
                for (let i = 0; i < Broken.length; i++) {
                    outputBonesStats.Stats.Broken += Broken[i].Value;
                }
            }
        }
        catch (error) {
            logger.warn(`Failed to aggregate stats:\n${JSON.stringify(error, null, 4)}`);
            caughtEx = {
                error: `Failed to aggregate stats: ${error.message}`,
                catch: catchMessage,
            };
        }

        var output = {
            BonesStats: outputBonesStats,
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
        logger.error(JSON.stringify(output, null, 4));
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
            logger.warn(JSON.stringify(output, null, 4));
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
        logger.error(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};

module.exports.checkBonesID = async (req, res) => {
    try {
        var bonesID = req.params.BonesID;
        const bones = await Bones.findByPk(bonesID);
        if (!bones) {
            logger.info(`checkBonesID, BonesID not found: ${bonesID}`);
            return res.status(204).json(false);
        }

        res.status(200).json(true);
    }
    catch (error) {
        var output = {
            message: `Error retrieving BonesID: ${bonesID}`,
            error: error.message
        };
        logger.error(JSON.stringify(output, null, 4));
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
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        res.status(200).json(bonesInfoIDs.map(row => {
            return row.ID;
        }));
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All BonesIDs',
            error: error.message
        };
        logger.error(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};

module.exports.deleteBones = async (req, res) => {
    const bonesID = req.params.BonesID;
    var any = false;
    try {
        var fragments = await this.tidySingleBones(bonesID);

        any = fragments.Bones > 0;

        var message = any
            ? `No bones with with BonesID: ${bonesID}`
            : `Deleted bones with BonesID: ${bonesID}`
            ;

        res.status(any ? 200 : 204).json(message);
    }
    catch (error) {
        var output = {
            message: `Error deleting bones with BonesID ${bonesID}`,
            error: error.message
        };
        logger.warn(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};

module.exports.deleteAllBones = async (req, res) => {
    var deletedBones = 0;
    var any = false;
    try {
        deletedBones = await Bones.destroy({
            truncate: true,
            cascade: true,
            hooks: true,
        });
        any = deletedBones > 0;
    }
    catch (error) {
        var output = {
            message: 'Error deleting Bones',
            error: error.message
        };
        logger.error(`${output}: ${error.message}`);
        res.status(500).json(output);
    }

    var message = any
        ? `Deleted all ${deletedBones} Bones`
        : `No Bones, but no errors`
        ;

    res.status(any ? 200 : 204).json(message);
};

module.exports.tidySingleBones = async (BonesID, Fragments) => {
    Fragments ??= {};
    if (!BonesID) {
        return Fragments;
    }

    logger.info(`Tidying [${BonesID}]`);
    try {
        const bones = await Bones.scope(Bones.forOutputScope).findByPk(BonesID);
        if (bones) {
            logger.info(`Bones.Destroy`);
            bones.destroy();
            Fragments.Bones ??= 0;
            Fragments.Bones++;
        }
    }
    catch (err) {
        logger.warn(`issue tidying Bones [${BonesID}]: ${err.message}`);
        Fragments.Errors++;
    }

    try {
        const reports = await Report.unscoped().findAll({
            where: {
                BonesID: BonesID,
            },
            include: Report.Bones,
        });
        if (reports) {
            for (let i = 0; i < reports.length; i++) {
                try {
                    let report = reports[i];
                    logger.info(`Report[${report.ID}].Destroy`);
                    report.destroy();
                    Fragments.Reports ??= 0;
                    Fragments.Reports++;
                }
                catch (err) {
                    logger.warn(`issue tidying Bones (Report[${i}]) [${BonesID}]: ${err.message}`);
                    Fragments.Errors++;
                }
            }
        }
    }
    catch (err) {
        logger.warn(`issue tidying Bones (Reports) [${BonesID}]: ${err.message}`);
        Fragments.Errors++;
    }

    try {
        const bonesSpec = await BonesSpec.unscoped().findByPk(BonesID, {
            include: BonesSpec.Bones,
        });
        if (bonesSpec) {
            logger.info(`BonesSpec.Destroy`);
            bonesSpec.destroy();
            Fragments.BonesSpecs ??= 0;
            Fragments.BonesSpecs++;
        }
    }
    catch (err) {
        logger.warn(`issue tidying Bones (BonesSpec) [${BonesID}]: ${err.message}`);
        Fragments.Errors++;
    }

    try {
        const bonesStats = await BonesStats.unscoped().findByPk(BonesID, {
            include: BonesStats.Bones,
        });
        if (bonesStats) {
            logger.info(`BonesStats.Destroy`);
            bonesStats.destroy();
            Fragments.BonesStats ??= 0;
            Fragments.BonesStats++;
        }
    }
    catch (err) {
        logger.warn(`issue tidying Bones (BonesStats) [${BonesID}]: ${err.message}`);
        Fragments.Errors++;
    }

    try {
        const modConfig = await ModConfig.unscoped().findByPk(BonesID, {
            include: ModConfig.Bones,
        });
        if (modConfig) {
            logger.info(`ModConfig.Destroy`);
            modConfig.destroy();
            Fragments.ModConfigs ??= 0;
            Fragments.ModConfigs++;
        }
    }
    catch (err) {
        logger.warn(`issue tidying Bones (ModConfigs) [${BonesID}]: ${err.message}`);
        Fragments.Errors++;
    }

    try {
        const modConfigRecords = await ModConfigRecord.unscoped().findAll({
            where: {
                ModConfigID: BonesID,
            },
        });
        if (modConfigRecords) {
            for (let i = 0; i < modConfigRecords.length; i++) {
                try {
                    let modConfigRecord = modConfigRecords[i];
                    logger.info(`ModConfig_Record[${modConfigRecord.ModConfigID}, ${modConfigRecord.ModRecordIndex}].Destroy`);
                    modConfigRecord.destroy();
                    Fragments.ModConfig_Record ??= 0;
                    Fragments.ModConfig_Record++;
                }
                catch (err) {
                    logger.warn(`issue tidying Bones (ModConfig_Record[${i}]) [${BonesID}]: ${err.message}`);
                    Fragments.Errors++;
                }
            }
        }
    }
    catch (err) {
        logger.warn(`issue tidying Bones (ModConfig_Record) [${BonesID}]: ${err.message}`);
        Fragments.Errors++;
    }

    return Fragments;
}

module.exports.tidyBones = async () => {
    try {
        const invalidBonesIDs = await Bones.unscoped().findAll({
            attribute: ['ID'],
            where: {
                SavGz: { [Op.is]: null },
            }
        });

        logger.info(`Tidying ${invalidBonesIDs?.length || 0} bone fragments...`);
        var fragments = {
            Errors: 0,
        };
        if (invalidBonesIDs) {
            try {
                for (let i = 0; i < invalidBonesIDs.length; i++) {
                    try {
                        let bonesID = invalidBonesIDs[i].ID;
                        fragments = await this.tidySingleBones(bonesID, fragments);
                    }
                    catch (err) {
                        logger.warn(`issue tidying Bones[${i}]) [${bonesID}]: ${err.message}`);
                    }
                }
            }
            catch (err) {
                logger.error(`Error tidying ${invalidBonesIDs.length} dataless Bones: ${err.message}`);
            }
        }

        logger.info(`Tidying orphans...`);
        try {
            const reports = await Report.findAll({
                include: [{
                    association: Report.Bones,
                    required: false,
                }],
            });
            if (reports) {
                logger.info(`Tidying orphaned Report...`);
                for (let i = 0; i < reports.length; i++) {
                    try {
                        let report = reports[i];
                        if (!report?.Bones) {
                            await report.destroy();
                            fragments.Orphans ??= {};
                            fragments.Orphans.Report ??= 0;
                            fragments.Orphans.Report++;
                        }
                    }
                    catch (err) {
                        logger.warn(`issue tidying orphaned Report[${i}]: ${err.message}`);
                        fragments.Orphans ??= {};
                        fragments.Orphans.Errors ??= 0;
                        fragments.Orphans.Errors++;
                    }
                }
            }
        }
        catch (err) {
            logger.error(`Error tidying orphaned Reports: ${err.message}`);
            fragments.Errors++;
        }

        const models = [
            BonesSpec,
            BonesStats,
            ModConfig,
        ];
        try {
            for (let i = 0; i < models.length; i++) {
                let model = models[i];
                let modelLabel = model.getTableName(); // Object.prototype.toString.call(model);
                try {
                    let instances = await model.findAll({
                        include: [{
                            association: model.Bones,
                            required: false,
                        }]
                    });
                    if (instances) {
                        logger.info(`Tidying orphaned ${modelLabel}...`);
                        for (let i = 0; i < instances.length; i++) {
                            try {
                                let instance = instances[i];
                                if (!await Bones.findByPk(instance.ID)) {
                                    await instance.destroy();
                                    fragments.Orphans ??= {};
                                    fragments.Orphans[modelLabel] ??= 0;
                                    fragments.Orphans[modelLabel]++;
                                }
                            }
                            catch (err) {
                                logger.warn(`issue tidying orphaned ${modelLabel}[${i}]: ${err.message}`);
                                fragments.Orphans ??= {};
                                fragments.Orphans.Errors ??= 0;
                                fragments.Orphans.Errors++;
                            }
                        }
                    }
                }
                catch (err) {
                    logger.error(`Error tidying orphaned ${modelLabel}: ${err.message}`);
                    fragments.Errors++;
                }
            }
        }
        catch (err) {
            logger.error(`Error tidying orphaned Models: ${err.message}`);
            fragments.Errors++;
        }

        try {
            logger.info(`Tidying orphaned ModConfigRecord...`);
            const modConfigRecords = await ModConfigRecord.findAll();
            if (modConfigRecords) {
                for (let i = 0; i < modConfigRecords.length; i++) {
                    let modConfigRecord = modConfigRecords[i];
                    try {
                        let modConfig = await ModConfig.findByPk(modConfigRecord.ModConfigID);
                        if (!modConfig) {
                            await modConfigRecord.destroy();
                            fragments.Orphans ??= {};
                            fragments.Orphans.ModConfigRecord ??= 0;
                            fragments.Orphans.ModConfigRecord++;
                        }
                    }
                    catch (err) {
                        logger.warn(`issue tidying orphaned ModConfigRecord[${i}]: ${err.message}`);
                        fragments.Orphans ??= {};
                        fragments.Orphans.Errors ??= 0;
                        fragments.Orphans.Errors++;
                    }
                }
            }
        }
        catch (err) {
            logger.error(`Error tidying orphaned ModConfigRecords: ${err.message}`);
            fragments.Errors++;
        }

    }
    catch (error) {
        logger.error(`Error tidying Bones ${error.message}`);
    }
    logger.info(`bone fragments tidied!\n${JSON.stringify(fragments, null, 4)}\n`);
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
        logger.error(JSON.stringify(output, null, 4));
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
        logger.error(JSON.stringify(output, null, 4));
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
    logger.info(JSON.stringify(output, null, 4));
    res.status(200).json(output);
};

module.exports.getBonesInfo = async (req, res) => {
    try {
        const BonesID = req.params.BonesID;
        const UserID = req.user?.ID;

        const bones = await Bones.scope(Bones.forOutputCleanScope).findByPk(BonesID, {
            attributes: { exclude: ['SavGz'] },
        });
        if (!bones) {
            var output = {
                error: `Bones Info not found: ${BonesID}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        const bonesJSON = bones.SaveBonesJSON;

        bonesJSON.IsYou = UserID
            && Bones.UserID != UserID;

        if (bones.Size > 0) {
            bonesJSON.Size = bones.Size;
        }

        var user;
        if (UserID) {
            user = Bones.User;
        }

        let wantSanitizeStats = !user
            || accessLevels[user.Access] < accessLevels['Manage'];

        bonesJSON.BonesStats = wantSanitizeStats
            ? bones.BonesStats.withStatsDictionary(UserID)
            : bones.BonesStats.withStatsDictionary()
            ;

        bonesJSON.BonesSpec = bones.BonesSpec;
        bonesJSON.EnabledMods = bones.ModConfig;

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
    var catchMessage = 'top of the run';
    try {
        catchMessage = 'req.params';
        var {
            from,
            to,
            UserID,
        } = req.params;

        catchMessage = 'userID';
        var userID = req.user?.ID || UserID;

        catchMessage = '!to';
        if (!to) {
            from = 0;
            to = 0;
        }

        catchMessage = 'from > to';
        if (from > to) {
            [from, to] = [to, from];
        }

        catchMessage = 'offset';
        var offset = from;
        var limit = Math.max(0, from - to);

        catchMessage = 'limit === 0';
        if (limit === 0) {
            limit = null;
        }

        catchMessage = 'constraints';
        var constraints = {
            SavGz: { [Op.not]: null },
        };

        catchMessage = 'req.body?.BonesIDs';
        if (req.body?.BonesIDs) {
            constraints.ID = { [Op.or]: req.body.BonesIDs }
        }

        catchMessage = 'allBones';
        const allBones = await Bones.findAll({
            attributes: { exclude: ['SavGz'] },
            where: constraints,
            order: [
                ['createdAt', 'DESC']
            ],
            offset: offset,
            limit: limit,
            include: Bones.forOutputCleanInclude,
        });
        catchMessage = 'allBones?.length';
        if ((allBones?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Bones, but no errors'
            });
            return;
        }
        catchMessage = 'var user';
        var user;
        if (userID) {
            user = await User.findByPk(userID);
        }

        catchMessage = 'wantSanitizeStats';
        let wantSanitizeStats = !user
            || accessLevels[user.Access] < accessLevels['Manage'];

        catchMessage = 'let bonesJSONs';
        let bonesJSONs = allBones.map((bones, i) => {
            try {
                catchMessage = `bonesJSON = bones[${i}].SaveBonesJSON`;
                let bonesJSON = bones.SaveBonesJSON;
                catchMessage = `bonesJSON[${i}].IsYou`;
                bonesJSON.IsYou = userID
                    && bones.UserID == userID;

                if (bones.Size > 0) {
                    catchMessage = `bonesJSON[${i}].Size`;
                    bonesJSON.Size = bones.Size;
                }

                catchMessage = `bonesJSON[${i}].BonesSpec`;
                bonesJSON.BonesSpec = bones.BonesSpec;

                catchMessage = `bonesJSON[${i}].BonesStats`;
                bonesJSON.BonesStats = wantSanitizeStats
                    ? bones.BonesStats.withStatsDictionary(userID)
                    : bones.BonesStats.withStatsDictionary()
                    ;

                catchMessage = `bonesJSON[${i}].EnabledMods`;
                bonesJSON.EnabledMods = bones.ModConfig;

                catchMessage = `return bonesJSON[${i}]`;
                return bonesJSON;
            }
            catch (err) {
                logger.warn(`getAllBonesInfo failed aggregating bones ${i} at catchMessage: ${catchMessage}; ${err.message}`);
                catchMessage = `catch[${i}] ${err.message}`;
            }
        });
        logger.info(`getAllBonesInfo sending response`);
        res.status(200).json(bonesJSONs);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving All BonesInfos (${catchMessage})`,
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
            logger.warn(JSON.stringify(output, null, 4));
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
        logger.error(JSON.stringify(output, null, 4));
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
        logger.error(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};


module.exports.getBonesStats = async (req, res) => {
    try {
        const {
            BonesID,
        } = req.params;

        const UserID = req.user?.ID;

        const bonesStats = await BonesStats.findByPk(BonesID);
        if (!bonesStats) {
            var output = {
                error: `Bones Stats not found: ${BonesID}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        var user;
        if (UserID) {
            user = await User.findByPk(UserID);
        }

        let wantSanitizeStats = !user
            || user.Access != 'Manage';

        var stats = wantSanitizeStats
            ? bonesStats.withStatsDictionary(user.ID)
            : bonesStats.withStatsDictionary()
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
        const UserID = req.user?.ID;

        const allBonesStats = await BonesStats.findAll({
            where: {
                Bones: { [Op.not]: null },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        if ((allBonesStats?.length || 0) == 0) {
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

        var bonesStats = new Array();

        for (let i = 0; i < allBonesStats.length; i++) {
            bonesStats[i] = wantSanitizeStats
                ? allBonesStats[i].withStatsDictionary(user.ID)
                : allBonesStats[i].withStatsDictionary()
                ;
        }

        res.status(200).json(bonesStats);
    }
    catch (error) {
        var output = {
            message: 'Error retrieving All BonesStats',
            error: error.message
        }
        logger.error(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};

module.exports.updateBonesStats = async (req, res) => {
    var catchMessage = '';
    try {
        const {
            Stat,
            BonesID,
        } = req.params

        const UserID = req.user?.ID;

        if (!Stat) {
            var output = {
                error: `No stat provided`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        catchMessage = `Failed to find User: ${UserID}`;
        const user = await User.findByPk(UserID);

        if (!user) {
            var output = {
                error: `User not found: ${UserID}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        catchMessage = `Failed to find Bones: ${BonesID}`;
        const bonesStats = await BonesStats.findByPk(BonesID);

        if (!bonesStats) {
            var output = {
                error: `Bones Info not found: ${BonesID}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        const storedStats = bonesStats;

        if (!Object.keys(bonesStats.Stats).includes(Stat)) {
            var output = {
                error: `Stat is not a tracked stat: ${Stat}`
            };
            logger.warn(JSON.stringify(output, null, 4));
            return res.status(204).json(output);
        }

        var storedStat = bonesStats.Stats[Stat];

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

        catchMessage = `Failed to update BonesStats.Stats: ${BonesID}`;
        bonesStats.update({
            Stats: storedStats,
        });

        /*catchMessage = `Failed to save BonesStats.Stats: ${BonesID}`;
        await bonesStats.save({
            fields: ['Stats']
        });*/

        catchMessage = `Failed to reload BonesStats: ${BonesID}`;
        await bonesStats.reload();

        let lastEncountered;
        const isEncountered = Stat == 'Encountered'
        if (isEncountered) {
            lastEncountered = BigInt(new Date() + 621355968000000000n) * 1000n;
        }

        catchMessage = `Failed to update BonesStats.LastEncountered`;
        if (isEncountered) {
            bonesStats.Update({
                LastEncountered: lastEncountered
            });
            /*catchMessage = `Failed to save BonesStats.LastEncountered: ${BonesID}`;
            await bonesStats.save({
                fields: ['LastEncountered']
            });*/
            catchMessage = `Failed to reload BonesStats: ${BonesID}`;
            await bonesStats.reload();
        }

        catchMessage = `Failed to report susccess: ${BonesID}`;
        var outputBonesStats = {
            BonesID: BonesID,
            LastEncountered: 'null',
            Stats: {
                Encountered: 0,
                Defeated: 0,
                Reclaimed: 0,
                Broken: 0,
            }
        };
        var caughtEx = null;
        try {
            catchMessage = `Failed to extract Stats`;
            const LastEncountered = bonesStats.LastEncountered;
            const {
                Encountered,
                Defeated,
                Reclaimed,
                Broken,
            } = bonesStats.Stats;

            if (LastEncountered > 0) {
                catchMessage = `Failed to make Date`;
                let t = (BigInt(LastEncountered) - 621355968000000000n) / 10000n;
                let d = new Date(Number(t));
                outputBonesStats.LastEncountered = d.toISOString();
            }
            if (Encountered) {
                catchMessage = `Failed to increment Encountered`;
                for (let i = 0; i < Encountered.length; i++) {
                    outputBonesStats.Stats.Encountered += Encountered[i].Value;
                }
            }
            if (Defeated) {
                catchMessage = `Failed to increment Defeated`;
                for (let i = 0; i < Defeated.length; i++) {
                    outputBonesStats.Stats.Defeated += Defeated[i].Value;
                }
            }
            if (Reclaimed) {
                catchMessage = `Failed to increment Reclaimed`;
                for (let i = 0; i < Reclaimed.length; i++) {
                    outputBonesStats.Stats.Reclaimed += Reclaimed[i].Value;
                }
            }
            if (Broken) {
                catchMessage = `Failed to increment Broken`;
                for (let i = 0; i < Broken.length; i++) {
                    outputBonesStats.Stats.Broken += Broken[i].Value;
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
            BonesStats: outputBonesStats,
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
        logger.error(JSON.stringify(output, null, 4));
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
            logger.warn(JSON.stringify(output, null, 4));
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
        logger.error(JSON.stringify(output, null, 4));
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
        logger.error(JSON.stringify(output, null, 4));
        res.status(500).json(output);
    }
};