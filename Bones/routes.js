const router = require('express').Router();
const { request } = require('express');
const BonesController = require('./controller');

const { produceToken, checkToken } = require('../Common/Middlewares/IsAllowedToPutSavGz');
const checkWL = require('../Common/Middlewares/IsWhiteListed').check;
const { checkAuth } = require('./../Common/Middlewares/IsAuthenticated');

// upload bones
router.post('/Bones/new', checkWL, produceToken, BonesController.createBones);
router.put('/Bones/SavGz/:BonesID', checkToken, checkWL, BonesController.addBonesSavGz);

// update bones stats
router.put('/Bones/Stats/:Stat/:BonesID/:UserID', checkWL, BonesController.updateBonesStats);

// download bones
router.get('/Bones/SavGz/:BonesID', BonesController.getBonesSaveGz)
router.post('/Bones/Download/:BonesID/:UserID', checkWL, BonesController.postDownloadBones)

// list IDs
router.get('/Bones/ID/:BonesID', BonesController.checkBonesID);
router.get('/Bones/IDs', BonesController.getAllBonesIDs);

// delete bones
router.delete('/Bones/del/:BonesID', checkAuth, BonesController.deleteBones);
router.delete('/del/Bones', checkAuth, BonesController.deleteAllBones);

module.exports = router;