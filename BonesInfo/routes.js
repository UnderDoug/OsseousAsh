const router = require('express').Router();
const { request } = require('express');
const BonesInfoController = require('./controller');

router.get('/v1/Bones/Info/:BonesID', BonesInfoController.getBonesInfo);
router.get('/v1/Bones/Infos', BonesInfoController.getAllBonesInfo);

module.exports = router;