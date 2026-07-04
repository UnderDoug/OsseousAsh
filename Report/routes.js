const router = require('express').Router();
const { request } = require('express');
const ReportController = require('./controller');

const { check } = require('../Common/Middlewares/IsWhiteListed');

// upload report
router.post('/Report/new', check, ReportController.createReport);

// update report
// tba

// check report exists from UserID
router.get('/v1/Report/Check/:BonesID/:UserID', ReportController.getHasReported);
router.get('/v1/ReportID/:ReportID', ReportController.getReports);

// list report(s)
router.get('/v1/Reports/:BonesID/:UserID', ReportController.getReports);
router.get('/v1/Reports/User/:UserID', ReportController.getAllReports);
router.get('/v1/Reports/Bones/:BonesID', ReportController.getAllReports);
router.get('/v1/Reports', ReportController.getAllReports);

// delete report(s)
router.delete('/v1/Report/del/:ReportID', ReportController.deleteReport);
router.delete('/v1/del/Reports/:BonesID/:UserID', ReportController.deleteAllReports);
router.delete('/v1/del/Reports/User/:UserID', ReportController.deleteAllReports);
router.delete('/v1/del/Reports/Bones/:BonesID', ReportController.deleteAllReports);
router.delete('/v1/del/Reports', ReportController.deleteAllReports);

module.exports = router;