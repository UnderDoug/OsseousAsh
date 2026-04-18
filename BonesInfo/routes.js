const router = require('express').Router();
const BonesInfoController = require('./controller');
router.post('/bonesinfo', BonesInfoController.POST);
router.get('/bonesinfo/', BonesInfoController.getBonesInfo);
router.get('/bonesinfo/all', BonesInfoController.getAllBonesInfo);
module.exports = router;