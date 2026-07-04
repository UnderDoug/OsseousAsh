const { logger } = require('../Common/logger');
const { Op } = require('sequelize');
const { Report } = require('../Common/Models/Report');

/*const Ajv = require('ajv');
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
const validate = ajv.compile(schema);*/

const createReport = async (req, res) => {
    /*if (!validate(req.body)) {
        return res.status(400).json({
            error: 'Invalid input',
            details: validate.errors
        });
    }*/

    var catchMessage = "";
    try {
        const {
            ID,
            UserID,
            BonesID,
            Type,
            ObjectDetails,
            Description,
            Actioned,
        } = req.body;

        catchMessage = "Failed to create Report";
        const report = await Report.create({
            UserID: UserID,
            BonesID: BonesID,
            Type: Type,
            ObjectDetails: ObjectDetails,
            Description: Description,
            Actioned: Actioned,
        });

        res.status(201).json(report);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: catchMessage,
            error: error.message
        });
    }
};

const getHasReported = async (req, res) => {
    let oAID;
    let bonesID;
    try {
        oAID = req.params.OAID
        bonesID = req.params.BonesID
        const reports = await Report.findAll({
            where: {
                OsseousAshID: oAID,
                BonesID: bonesID,
            },
        });

        if ((reports?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Reports, but no errors'
            });
            return;
        }

        var anyBlocked = true;
        for (let i = 0; i < reports.length; i++) {
            if (reports[i].Blocked) {
                anyBlocked = true;
                break;
            }
        }

        return res.status(200).json({
            reports: reports.length,
            blocked: anyBlocked,
        });
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Reports, BonesID: ${bonesID}, OsseousAshID: ${OsseousAshID}`,
            error: error.message
        });
    }
};

const getReport = async (req, res) => {
    let reportID;
    try {
        reportID = req.params.BonesID
        const report = await Report.findByPk(reportID);

        if (!report)
            return res.status(204).json({
                error: `Report not found: ${reportID}`
            });

        res.status(200).json(report);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Report: ${reportID}`,
            error: error.message
        });
    }
};

const getReports = async (req, res) => {
    let oAID;
    let bonesID;
    try {
        oAID = req.params.OAID
        bonesID = req.params.BonesID

        var condition = {};

        if (oAID) {
            condition.OsseousAshID = oAID;
        }
        if (bonesID) {
            condition.BonesID = bonesID;
        }

        if (!oAID
            && !bonesID) {
            var output = {
                message: 'Request requires at least one of BonesID or OsseousAshID',
            };
            logger.warn(output);
            return res.status(500).json(output);
        }
           
        const reports = await Report.findAll({
            where: condition,
            order: [
                ['createdAt', 'DESC']
            ],
        });

        if ((reports?.length || 0) == 0) {
            res.status(204).json({
                message: 'No Reports, but no errors'
            });
            return;
        }

        res.status(200).json(reports);
    }
    catch (error) {
        logger.caught(res, 500, {
            message: `Error retrieving Reports, BonesID: ${bonesID}, OsseousAshID: ${OsseousAshID}`,
            error: error.message
        });
    }
};

const getAllReports = async (req, res) => {
    let oAID;
    let bonesID;
    try {
        oAID = req.params.OAID
        bonesID = req.params.BonesID

        var condition = {};

        if (oAID) {
            condition.OsseousAshID = oAID;
        }
        if (bonesID) {
            condition.BonesID = bonesID;
        }

        var reportsRaw = null;
        if (oAID
            || bonesID) {
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

const deleteReport = async (req, res) => {
    let reportID;
    try {
        reportID = req.params.BonesID
        const report = await Report.findByPk(reportID);

        if (!report) {
            var output = {
                error: `Report not found: ${reportID}`
            };
            logger.warn(output);
            return res.status(204).json(output);
        }
        var output = {
            message: `Deleted Report with ID: ${reportID}`
        };
        logger.info(output);
        res.status(200).json(output);
    }
    catch (error) {
        var output = {
            message: `Error deleting Report: ${reportID}`,
            error: error.message
        };
        logger.error(output);
        res.status(500).json(output);
    }
};

const deleteAllReports = async (req, res) => {
    let oAID;
    let bonesID;
    let deleteCount = 0;
    var errors = {};
    var errorCount = 0;
    try {
        oAID = req.params.OAID
        bonesID = req.params.BonesID

        var condition = {};

        if (oAID) {
            condition.OsseousAshID = oAID;
        }
        if (bonesID) {
            condition.BonesID = bonesID;
        }

        var reportsRaw = null;
        if (oAID
            || bonesID) {
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

    if (bonesID) {
        message += `, BonesID: ${bonesID}`;
    }
    if (oAID) {
        message += `, OsseousAshID: ${oAID}`;
    }
    var output = {
        deleted: deleteCount,
        message: message,
        reportErrors: errors,
    };
    logger.info(output);
    res.status(200).json(output);
};

module.exports = {
    createReport,
    getHasReported,
    getReport,
    getReports,
    getAllReports,
    deleteReport,
    deleteAllReports,
};