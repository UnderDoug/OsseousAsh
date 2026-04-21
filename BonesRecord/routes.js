const router = require('express').Router();
const { request } = require('express');
const BonesRecordController = require('./controller');
const { allow, check } = require('../common/middlewares/IsAllowedToPutSavGz')
router.post('/Bones', allow, BonesRecordController.createBones);
router.put('/Bones/SavGz/:BonesID', check, BonesRecordController.addBonesSavGz);
router.get('/Bones', BonesRecordController.getAllBones);
router.get('/Bones/:BonesID', BonesRecordController.getBones);
router.delete('/del/Bones', BonesRecordController.deleteAllBones);
router.delete('/Bones/del/:BonesID', BonesRecordController.deleteBones);
module.exports = router;