const router = require('express').Router();
const { request } = require('express');
const UserController = require('./controller');

const checkWL = require('./../Common/Middlewares/IsWhiteListed').check;
const { checkAuth } = require('./../Common/Middlewares/IsAuthenticated');

router.get('/canUp/:UserID', checkWL, async (req, res) => {
    res.status(200).json(true);
});

router.post('/User/new', UserController.createUser);
router.post('/User/Update/:UserID', UserController.updateUser);

router.post('/User/Login', UserController.postLogin);

router.get('/Users', UserController.getAllUsers);
router.get('/User/:UserID', UserController.getUser);
router.post('/User/Status/:UserID', checkAuth, UserController.getUserStatus);
router.post('/User/Handle/:UserID', checkAuth, UserController.getUserHandle);

module.exports = router;