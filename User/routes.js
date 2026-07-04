const router = require('express').Router();
const { request } = require('express');
const UserController = require('./controller');

const checkWL = require('./../Common/Middlewares/IsWhiteListed').check;
const { checkAuth } = require('./../Common/Middlewares/IsAuthenticated');

router.get('/v1/canUp/:UserID', checkWL, async (req, res) => {
    res.status(200).json(true);
});

router.post('/v1/User/new', UserController.createUser);
router.post('/v1/User/Update/:UserID', UserController.updateUser);

router.post('/v1/User/Login', UserController.postLogin);

router.get('/v1/Users', UserController.getAllUsers);
router.get('/v1/User/:UserID', UserController.getUser);
router.post('/v1/User/Status/:UserID', checkAuth, UserController.getUserStatus);
router.post('/v1/User/Handle/:UserID', checkAuth, UserController.getUserHandle);

module.exports = router;