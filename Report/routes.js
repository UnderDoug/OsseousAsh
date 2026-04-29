const router = require('express').Router();
const { request } = require('express');
const ReportController = require('./controller');

const { check } = require('../Common/Middlewares/IsWhiteListed');

// upload report
router.post('/Report', check, ReportController.createReport);

// update report
// tba

// check report exists from OAID
router.get('/Report/Check/:BonesID/:OAID', ReportController.getHasReported);
router.get('/ReportID/:ReportID', ReportController.getReports);

// list report(s)
router.get('/Reports/:BonesID/:OAID', ReportController.getReports);
router.get('/Reports/OAID/:OAID', ReportController.getAllReports);
router.get('/Reports/BonesID/:BonesID', ReportController.getAllReports);
router.get('/Reports', ReportController.getAllReports);

// delete report(s)
router.delete('/Report/del/:ReportID', ReportController.deleteReport);
router.delete('/del/Reports/:BonesID/:OAID', ReportController.deleteAllReports);
router.delete('/del/Reports/OAID/:OAID', ReportController.deleteAllReports);
router.delete('/del/Reports/BonesID/:BonesID', ReportController.deleteAllReports);
router.delete('/del/Reports', ReportController.deleteAllReports);

module.exports = router;