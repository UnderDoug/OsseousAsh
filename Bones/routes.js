const router = require('express').Router();
const { request } = require('express');
const BonesController = require('./controller');

const { produceToken, checkToken } = require('../Common/Middlewares/IsAllowedToPutSavGz');
const checkWL = require('../Common/Middlewares/IsWhiteListed').check;

// upload bones
router.post('/v1/Bones/new', checkWL, produceToken, BonesController.createBones);
router.put('/v1/Bones/SavGz/:BonesID', checkToken, checkWL, BonesController.addBonesSavGz);

// update bones stats
router.put('/v1/Bones/Stats/:BonesID/:OAID', checkWL, BonesController.updateBonesStats);

// download bones
router.get('/v1/Bones/SavGz/:BonesID', BonesController.getBonesSaveGz)
router.post('/v1/Bones/Download/:BonesID/:OAID', checkWL, BonesController.postDownloadBones)

// list IDs
router.get('/v1/Bones/ID/:BonesID', BonesController.checkBonesID);
router.get('/v1/Bones/IDs', BonesController.getAllBonesIDs);

// delete bones
router.delete('/v1/del/Bones', BonesController.deleteAllBones);
router.delete('/v1/Bones/del/:BonesID', BonesController.deleteBones);

module.exports = router;