const router = require('express').Router();
const BonesInfoController = require('./controller');
router.get('/BonesInfo/:BonesID', BonesInfoController.getBonesInfo);
router.get('/BonesSpec/:BonesID', BonesInfoController.getBonesSpec);
router.get('/Bones/SavGz/:BonesID', BonesInfoController.getBonesSaveGz);
router.get('/BonesInfos', BonesInfoController.getAllBonesInfo);
router.get('/BonesIDs', BonesInfoController.getAllBonesID);
module.exports = router;