const router = require('express').Router();
const BonesSpecController = require('./controller');
router.post('/BonesSpec', BonesSpecController.createBonesSpec);
router.get('/BonesSpec/all', BonesSpecController.getAllBonesSpec);
//router.get('/BonesSpec/:BonesID', BonesSpecController.getBonesSpec);
router.get('/BonesSpecs', BonesSpecController.getAllBonesSpec);
module.exports = router;