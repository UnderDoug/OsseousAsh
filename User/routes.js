const router = require('express').Router();
const { request } = require('express');
const UserController = require('./controller');
const { checkAuth, checkCanDownload, checkCanUpload, checkCanManage, requireSelfOrManage } = require('./../Common/Middlewares/IsAuthenticated');

// public userID ability to upload to this server as a true/false
router.get('/users/:UserID/upload-eligibility', UserController.getCanUp);

// new user
router.post('/users', UserController.createUser);

// update user
router.put('/users/:UserID', checkAuth, checkCanManage, UserController.updateUser);                          // private
router.put('/users/:UserID/handle', checkAuth, requireSelfOrManage, UserController.updateUserHandle);   // public
router.put('/users/:UserID/password', checkAuth, requireSelfOrManage, UserController.updateUserHandle); // public

// procure a jwt-token
// include 'basic password' authorization header.
// returns tokenized UserID and SessionID
router.get('/users/:UserID/session', UserController.getSession);

// display only user handle, status, access, created date and updated date of every user
router.get('/users', UserController.getAllUsers);

router.get('/users/:UserID/status', UserController.getUserStatus);
router.get('/users/:UserID/handle', UserController.getUserHandle);

// display all details (obfuscated password if one exists) of a given user.
router.get('/users/:UserID', checkAuth, requireSelfOrManage, UserController.getUser);

// reports related
router.get('/users/:UserID/reports', checkAuth, requireSelfOrManage, UserController.getAllReports);
router.delete('/users/:UserID/reports', checkAuth, requireSelfOrManage, UserController.deleteAllReports);

module.exports = router;