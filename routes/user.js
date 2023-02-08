var express = require('express');
var router = express.Router();
const userController = require('../controllers/user');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/verify-email/:token',userController.verifyEmail)


module.exports = router;
