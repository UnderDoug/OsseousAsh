const router = require('express').Router();
const { request } = require('express');
const BonesController = require('./controller');

const { assignUploadToken, checkUploadAuth } = require('../Common/Middlewares/IsPendingUpload');
const { checkAuth, checkCanDownload, checkCanUpload, requireSelfOrManage } = require('./../Common/Middlewares/IsAuthenticated');

// upload bones
router.post('/bones', checkAuth, checkCanUpload, assignUploadToken, BonesController.createBones);
router.put('/bones/:BonesID/bytes-gz', checkAuth, checkCanUpload, checkUploadAuth, BonesController.addBonesSavGz);

// download bones
router.get('/bones/:BonesID/bytes-gz', checkAuth, checkCanDownload, BonesController.getBonesSaveGz);

// list IDs
router.get('/bones/:BonesID/confirmation', BonesController.checkBonesID);
router.get('/bones/ids', BonesController.getAllBonesIDs);

// delete bones
router.delete('/bones/:BonesID', checkAuth, requireSelfOrManage, BonesController.deleteBones);
router.delete('/bones', checkAuth, requireSelfOrManage, BonesController.deleteAllBones);

// report related
router.get('/bones/:BonesID/reports', checkAuth, requireSelfOrManage, BonesController.getAllReports);
router.delete('/bones/:BonesID/reports', checkAuth, requireSelfOrManage, BonesController.deleteAllReports);


// Infos
router.get('/bones/infos', checkAuth, checkCanDownload, BonesController.getAllBonesInfo);
router.post('/bones/infos', checkAuth, checkCanDownload, BonesController.getAllBonesInfo); // include an array of bones IDs in the body
router.get('/bones/:BonesID/info', checkAuth, checkCanDownload, BonesController.getBonesInfo);
router.get('/bones/infos/paged/:from-:to', checkAuth, checkCanDownload, BonesController.getAllBonesInfo);

// Specs
router.get('/bones/specs', checkAuth, checkCanDownload, BonesController.getAllBonesSpecs);
router.get('/bones/:BonesID/spec', checkAuth, checkCanDownload, BonesController.getBonesSpec);
router.get('/bones/IDs/spec', checkAuth, checkCanDownload, BonesController.getBonesIDsMatchingSpec);

// Stats
router.get('/bones/stat-sets', checkAuth, checkCanDownload, BonesController.getAllBonesStats);
router.get('/bones/:BonesID/stat-sets', checkAuth, checkCanDownload, BonesController.getBonesStats);
// update bones stats
router.put('/bones/:BonesID/stat-sets/:Stat', checkAuth, checkCanDownload, BonesController.updateBonesStats);

// ModConfigs
router.get('/bones/mod-configs', checkAuth, checkCanDownload, BonesController.getAllModConfigs);
router.get('/bones/:BonesID/mod-configs', checkAuth, checkCanDownload, BonesController.getModConfig);
router.get('/bones/mod-configs/spec', checkAuth, checkCanDownload, BonesController.getAllModConfigs);

module.exports = router;