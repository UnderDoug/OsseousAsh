const router = require('express').Router();
const { request } = require('express');
const BonesController = require('./controller');

const { allow, check } = require('../Common/Middlewares/IsAllowedToPutSavGz');
const checkWL = require('../Common/Middlewares/IsWhiteListed').check;

// upload bones
router.post('/Bones', checkWL, allow, BonesController.createBones);
router.put('/Bones/SavGz/:BonesID', check, checkWL, BonesController.addBonesSavGz);

// update bones stats
router.put('/Bones/Stats/:BonesID/:OAID', checkWL, BonesController.updateBonesStats);

router.get('/Bones/SavGz/:BonesID', BonesController.getBonesSaveGz)

// list IDs
router.get('/Bones/ID/:BonesID', BonesController.checkBonesID);
router.get('/Bones/IDs', BonesController.getAllBonesIDs);

// delete bones
router.delete('/del/Bones', BonesController.deleteAllBones);
router.delete('/Bones/del/:BonesID', BonesController.deleteBones);

module.exports = router;