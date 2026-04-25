const router = require('express').Router();
const BonesSpecController = require('./controller');
router.get('/Bones/Spec/:BonesID', BonesSpecController.getBonesSpec);
router.get('/Bones/Specs', BonesSpecController.getAllBonesSpecs);
module.exports = router;