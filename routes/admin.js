var express = require('express');
var router = express.Router();
var multer = require('multer');
var mongoose=require('mongoose')
var event=require("../models/event");
const { viewevents } = require('../controllers/admincontrol');
const json = require('json');
const path=require('path')



var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '-' + Math.random()+ path.extname(file.originalname))
  }
});
var upload = multer({ storage: storage });




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

router.get('/events', function(req, res, next) {
  res.render('admin/events',{admin:true})
});
router.post('/save', upload.single('image'), function(req, res) {
  console.log(req.body);
  console.log(req.file);
     const newevent = new event({
      title: req.body.title,
      description: req.body.description,
      imagePath: path.normalize(req.file.path).replace(/\\/g, '/').replace("public", ""),
      date:req.body.date,
    });
  

  newevent.save(function(err, event) {
    if (err) {
      return res.status(500).send(err);
    }

    res.redirect('/admin/events')
  });
});

router.get('/eventsview', (req, res) => {
  viewevents().then(events => {

     console.log(events);
    
  
    
    res.render('admin/viewevents', { events ,admin:true});
  }).catch(err => {
    console.error(err);
    res.status(500).send({ error: "Error fetching events" });
  });
});



router.get('/addimage',(req,res)=>{
  res.render("admin/addimage",{admin:true})
})


module.exports = router;
