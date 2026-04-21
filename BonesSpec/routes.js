const router = require('express').Router();
const BonesSpecController = require('./controller');
router.get('/BonesSpec/all', BonesSpecController.getAllBonesSpec);
router.get('/BonesSpecs', BonesSpecController.getAllBonesSpec);
module.exports = router;