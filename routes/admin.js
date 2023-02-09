var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/adminlogin')
});
router.get('/home', function(req, res, next) {
  res.render('admin/adminhome',{admin:true})
});
router.get('/families', function(req, res, next) {
  res.render('admin/families',{admin:true})
});
router.get('/prayer', function(req, res, next) {
  res.render('admin/prayertime',{admin:true})
});

module.exports = router;
