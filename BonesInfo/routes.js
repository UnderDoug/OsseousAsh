const router = require('express').Router();
const BonesInfoController = require('./controller');
router.get('/Bones/Info/:BonesID', BonesInfoController.getBonesInfo);
router.get('/Bones/Infos', BonesInfoController.getAllBonesInfo);
module.exports = router;