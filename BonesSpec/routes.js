const router = require('express').Router();
const { request } = require('express');
const BonesSpecController = require('./controller');

router.get('/v1/Bones/Spec/:BonesID', BonesSpecController.getBonesSpec);
router.get('/v1/Bones/Specs', BonesSpecController.getAllBonesSpecs);

module.exports = router;