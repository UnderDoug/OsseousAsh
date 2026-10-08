const router = require('express').Router();
const { request } = require('express');
const BonesSpecController = require('./controller');

router.get('/Bones/Spec/:BonesID', BonesSpecController.getBonesSpec);
router.get('/Bones/Specs', BonesSpecController.getAllBonesSpecs);

router.post('/Bones/MatchingSpec', BonesSpecController.getMatchingBonesSpecs);

module.exports = router;