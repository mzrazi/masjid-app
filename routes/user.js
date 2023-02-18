var express = require('express');
const { reset } = require('nodemon');
const { viewevents, editProfile, changePassword, addfamily, viewall, viewuserfamily, userdetails, savemessage, editfamily, deletefamily, getimages, forgotpassword, verifytoken, resetpassword } = require('../controllers/usercontrol');
var router = express.Router();
const userController = require('../controllers/usercontrol');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('user/index');
});

router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/verify-email/:token',userController.verifyEmail)
router.get('/view-events',viewevents)
router.put('/edit-profile',editProfile)
router.post("/change-password", changePassword)
router.post("/add-families",addfamily)
router.get("/view-families",viewall)
router.get("/user-family",viewuserfamily)
router.get("/user-details",userdetails)
router.post("/message",savemessage)
router.put("/edit-member",editfamily)
router.delete("/delete-member",deletefamily)
router.get("/gallery",getimages)
router.post("/forgot-password",forgotpassword),
router.get("/verify-token/:resetToken",verifytoken)
router.post("/reset-password/:resetToken",resetpassword)


module.exports = router; 
