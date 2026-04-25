const router = require('express').Router();
const { request } = require('express');
const BonesController = require('./controller');

const { allow, check } = require('../Common/Middlewares/IsAllowedToPutSavGz');
const checkWL = require('../Common/Middlewares/IsWhiteListed').check;

// upload bones
router.post('/Bones', checkWL, allow, BonesController.createBones);
router.put('/Bones/SavGz/:BonesID', check, checkWL, BonesController.addBonesSavGz);

// update bones stats
// tba

// list IDs
router.get('/Bones/ID', BonesController.checkBonesID);
router.get('/Bones/IDs', BonesController.getAllBonesIDs);

// delete bones
router.delete('/del/Bones', BonesController.deleteAllBones);
router.delete('/Bones/del/:BonesID', BonesController.deleteBones);

module.exports = router;