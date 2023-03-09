var express = require('express');
var router = express.Router();
var multer = require('multer');
var mongoose=require('mongoose')
var event=require("../models/event");
const { viewevents, getevent, announce } = require('../controllers/admincontrol');
const json = require('json');
const path=require('path')
const gallery=require("../models/gallerymodel")
const fs =require("fs")
const announcemodel=require("../models/announcemodel");
const { Family, User, payments } = require('../models/usermodel');
const admin = require('firebase-admin');


const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});




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
router.get('/families',async function(req, res, next) {

  const users = await User.find({});
  const families = await Promise.all(users.map(async (user) => {
    const familyLength = user.Family.length;
    return { ...user.toObject(), familyLength };
  }));
  console.log(families);
  res.render('admin/families',{admin:true,families})
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



router.get('/add-image',async(req,res)=>{
  var images=await gallery.find({}).exec()
  res.render("admin/addimage",{admin:true,images})
})

router.get("/delete-event/:id",async(req,res)=>{
   try {
  const id = req.params.id;
  
  await event.findByIdAndDelete(id);
  
  res.redirect('/admin/events');
} catch (err) {
  // handle errors
  console.error(err);
  res.status(500).send('An error occurred while deleting the event.');
}
})
router.get("/edit-event/:id",async(req,res)=>{

var event = await getevent(req.params.id)


res.render("admin/editevent",{event})
})
router.post('/save-image', upload.single('file'), function(req, res) {
 
  console.log(req.file);
     const newimage = new gallery({
     
      imagePath: path.normalize(req.file.path).replace(/\\/g, '/').replace("public", ""),
      
    })
    newimage.save(function(err, event) {
      if (err) {
        return res.status(500).send(err);
      }
  
      res.redirect('/admin/add-image')
  })
})

router.get('/announcements',async(req,res)=>{

 var users= await User.find({emailverified:true}).exec()


  res.render('admin/announcements',{admin:true,users})
})

router.get('/imagedelete/:id',async (req, res) => {
  const id= req.params.id;
  const galleryitem= await gallery.findById(id).exec()
  const imagePath=galleryitem.imagePath
  console.log(imagePath);

  fs.unlink(`./public/${imagePath}`, async(err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      await gallery.findByIdAndDelete(id)
      res.redirect('/admin/add-image')
    }


  })
});
router.post('/announce',(req,res)=>{

  const { title, message } = req.body;

  // Create a new document using the model
  const newAnnounce = new announcemodel({ title, message });

  // Save the document to the database
  newAnnounce.save((err) => {
    if (err) {
      // Handle any validation errors
      const validationErrors = Object.values(err.errors).map(error => error.message);
      res.redirect('error',{message:validationErrors})
    } else {
      res.redirect('/admin/announcements');
    }
  });
 
})
router.get('/payments/:id',async(req,res)=>{

const paymentschema=await payments.find({user:req.params.id})
 console.log(paymentschema);
  
  res.render('admin/payments',{admin:true,paymentschema})
}),
router.get('/members/:id',async(req,res)=>{

  var family= await User.findById(req.params.id).populate({
    path: "Family",
    model: "Family"
  })
 
  var familymembers=family.Family

  console.log(familymembers);
  res.render('admin/members',{admin:true,familymembers})
}),

router.post('/send-notification', async (req, res) => {
  const { title, message, selectedUsers } = req.body;
  console.log(req.body);
  try {
    // If "Select All" is checked, retrieve all email-verified users' tokens
    let tokens = [];
    if (selectedUsers === 'all') {
      const users = await User.find({ emailverified: true });
      console.log(users);
      tokens = users.flatMap((user) => user.tokens);
      console.log(tokens);
    } else {
      // Find the specific user and retrieve their token
      const user = await User.findOne({ _id: selectedUsers });
      if (!user) throw new Error('User not found');
      tokens = user.tokens;
    }

    if (tokens.length === 0) {
      throw new Error('No valid tokens found');
    }

    // Remove any invalid tokens

 
    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: {
        title:title,
        body: message,
      },
    });

    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        invalidTokens.push(tokens[idx]);
      }
    });

    if (invalidTokens.length > 0) {
      // Remove invalid tokens from user's tokens array
      await User.updateMany(
        { tokens: { $in: invalidTokens } },
        { $pull: { tokens: { $in: invalidTokens } } }
      );
    }

    // Call announce function only if notification is sent successfully
    announce(req.body);

    // Render announcement page if notification sent successfully
    res.redirect('/admin/announcements');
  } catch (error) {
    console.error(error);
    // Render error page with appropriate error message
    if (error.code === 'messaging/invalid-argument' && error.message === 'tokens must be a non-empty array') {
      res.render('error', { error: 'No valid tokens found' ,message:'No valid tokens found'});
    } else {
      res.render('error', { error: 'Internal server error',message:"error" });
    }
    
  }
});










module.exports = router;
