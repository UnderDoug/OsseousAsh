const sequelize = require('../Common/database');
const defineReport = require('../Common/Models/Report');
const Report = defineReport(sequelize);
const { Op } = require('sequelize');

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
            OsseousAshID,
            BonesID,
            Type,
            ObjectDetails,
            Description,
            Actioned,
        } = req.body;

        catchMessage = "Failed to create Report";
        const report = await Report.create({
            OsseousAshID: OsseousAshID,
            BonesID: BonesID,
            Type: Type,
            ObjectDetails: ObjectDetails,
            Description: Description,
            Actioned: Actioned,
        });

        res.status(201).json({
            success: true,
            report: report,
        });
    }
    catch (error) {
        console.log({
            status: 500,
            success: false,
            message: catchMessage,
            error: error.message
        });
        res.status(500).json({
            success: false,
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

        if (!reports
            || reports.length == 0)
            return res.status(204).json({
                success: true
            });

        return res.status(200).json({
            reports: reports.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
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
            return res.status(404).json({
                success: false,
                error: `Report not found: ${reportID}`
            });

        res.status(200).json({
            success: true,
            report
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
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
            && !bonesID)
            return res.status(500).json({
                success: false,
                message: 'Request requires at least one of BonesID or OsseousAshID',
            });

        const reports = await Report.findAll({
            where: condition,
            order: [
                ['createdAt', 'DESC']
            ],
        });

        if (!reports
            || reports.length == 0)
            return res.status(204).json({
                success: true,
                message: 'No Reports, but no errors'
            });

        res.status(200).json({
            success: true,
            data: reports,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
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

        if (!reports
            || reports.length == 0)
            return res.status(204).json({
                success: true,
                message: 'No Reports, but no errors'
            });

        res.status(200).json({
            success: true,
            data: reports,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving All Reports',
            error: error.message
        });
    }
};

const deleteReport = async (req, res) => {
    let reportID;
    try {
        reportID = req.params.BonesID
        const report = await Report.findByPk(reportID);

        if (!report)
            return res.status(404).json({
                success: false,
                error: `Report not found: ${reportID}`
            });

        res.status(200).json({
            success: true,
            message: `Deleted Report with ID: ${reportID}`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error deleting Report: ${reportID}`,
            error: error.message
        });
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

        if (!reports
            || reports.length == 0)
            return res.status(204).json({
                success: true,
                message: 'No reports, but no errors'
            })
        
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
        res.status(500).json({
            success: false,
            message: 'Error deleting All Reports',
            error: error.message,
            reportErrors: errors,
        });
    }

    var message = `Deleted all Reports`;

    if (bonesID) {
        message += `, BonesID: ${bonesID}`;
    }
    if (oAID) {
        message += `, OsseousAshID: ${oAID}`;
    }

    res.status(200).json({
        success: true,
        deleted: deleteCount,
        message: message,
        reportErrors: errors,
    });
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