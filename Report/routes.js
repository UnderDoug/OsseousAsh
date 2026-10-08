const router = require('express').Router();
const { request } = require('express');
const ReportController = require('./controller');

const { check } = require('../Common/Middlewares/IsWhiteListed');
const { checkAuth } = require('./../Common/Middlewares/IsAuthenticated');

// upload report
router.post('/Report/new', check, ReportController.createReport);

// update report
router.put('/Report/:ReportID', checkAuth, ReportController.updateReport);

// check report exists from UserID
router.get('/Report/Check/:BonesID/:UserID', ReportController.getHasReported);
router.get('/Report/:ReportID', ReportController.getReport);

// list report(s)
router.post('/Reports/:BonesID/:UserID', checkAuth, ReportController.getReports);
router.post('/Reports/User/:UserID', checkAuth, ReportController.getAllReports);
router.post('/Reports/Bones/:BonesID', checkAuth, ReportController.getAllReports);
router.post('/Reports', checkAuth, ReportController.getAllReports);

// delete report(s)
router.delete('/Report/del/:ReportID', ReportController.deleteReport);
router.delete('/del/Reports/:BonesID/:UserID', ReportController.deleteAllReports);
router.delete('/del/Reports/User/:UserID', ReportController.deleteAllReports);
router.delete('/del/Reports/Bones/:BonesID', ReportController.deleteAllReports);
router.delete('/del/Reports', ReportController.deleteAllReports);

module.exports = router;