const router = require('express').Router();
const BonesInfoController = require('./controller');
router.post('/BonesInfo', BonesInfoController.createBonesInfo);
// router.get('/BonesInfo/all', BonesInfoController.getAllBonesInfo);
router.get('/BonesInfo/:BonesID', BonesInfoController.getBonesInfo);
router.get('/BonesSpec/:BonesID', BonesInfoController.getBonesSpec);
router.get('/Bones/SavGz/:BonesID', BonesInfoController.getBonesSaveGz);
router.get('/BonesInfos', BonesInfoController.getAllBonesInfo);
module.exports = router;