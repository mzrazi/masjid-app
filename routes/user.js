var express = require('express');
var router = express.Router();
const userController = require('../controllers/usercontrol');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('user/index');
});

router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/verify-email/:token',userController.verifyEmail)


module.exports = router;
