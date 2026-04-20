const router = require('express').Router();
const BonesRecordController = require('./controller');
router.post('/Bones', BonesRecordController.createBones);
router.get('/Bones', BonesRecordController.getAllBones);
router.get('/Bones/:BonesID', BonesRecordController.getBones);
router.delete('/Bones/del/:BonesID', BonesRecordController.deleteBones);
router.delete('/BonesInfo/del/:BonesID', BonesRecordController.deleteBones);
router.delete('/BonesSpec/del/:BonesID', BonesRecordController.deleteBones);
module.exports = router;