var express = require('express');
const { viewevents, editProfile, changePassword, addfamily, viewall, viewuserfamily, userdetails } = require('../controllers/usercontrol');
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
router.post('/edit-profile',editProfile)
router.post("/change-password", changePassword)
router.post("/add-families",addfamily)
router.get("/view-families",viewall)
router.get("/user-family",viewuserfamily)
router.get("/user-details",userdetails)


module.exports = router; 
