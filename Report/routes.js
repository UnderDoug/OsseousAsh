const router = require('express').Router();
const { request } = require('express');
const ReportController = require('./controller');

const { checkAuth, requireSelfOrManage } = require('./../Common/Middlewares/IsAuthenticated');

// upload report
router.post('/reports', checkAuth, ReportController.createReport);

// update report
router.put('/reports/:ReportID', checkAuth, requireSelfOrManage, ReportController.updateReport);
router.put('/reports/:BonesID/:UserID/blocked', checkAuth, requireSelfOrManage, ReportController.updateBlocked);

// check report exists from UserID
router.get('/reports/:BonesID/:UserID/confirmation', checkAuth, requireSelfOrManage, ReportController.getHasReported);
router.get('/reports/:BonesID/:UserID/blocked', checkAuth, requireSelfOrManage, ReportController.getBlocked);
router.get('/reports/:ReportID', checkAuth, requireSelfOrManage, ReportController.getReport);

// list report(s)
router.get('/reports/:BonesID/:UserID', checkAuth, requireSelfOrManage, ReportController.getReports);
router.get('/reports', checkAuth, requireSelfOrManage, ReportController.getAllReports);

// delete report(s)
router.delete('/reports/:ReportID', checkAuth, requireSelfOrManage, ReportController.deleteReport);
router.delete('/reports/:BonesID/:UserID', checkAuth, requireSelfOrManage, ReportController.deleteAllReports);
router.delete('/reports', checkAuth, requireSelfOrManage, ReportController.deleteAllReports);

module.exports = router;