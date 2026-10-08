const router = require('express').Router();
const { request } = require('express');
const BonesInfoController = require('./controller');
const { silentAuth } = require('./../Common/Middlewares/IsAuthenticated');

router.get('/Bones/Info/:BonesID{/:UserID}', silentAuth, BonesInfoController.getBonesInfo);
router.get('/Bones/Infos{/:UserID}', silentAuth, BonesInfoController.getAllBonesInfo);
router.get('/Bones/Paged/Infos/:from-:to{/:UserID}', silentAuth, BonesInfoController.getAllBonesInfo);

module.exports = router;