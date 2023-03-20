var express = require('express');
var router = express.Router();
var multer = require('multer');
var mongoose = require('mongoose')
var event = require("../models/event");
const {
    viewevents,
    getevent,
    announce,
    getusermembers,
    getmessages,
    geteditevent,
    getAdminNotifications,
    loginauth,
    signupadmin,
    getuserpay,
    changePaymentStatus,
    deleteNotification,
    deleteMessage,
    getUserDashboardData,
    changeAdminPass,
    changeAdminUsername,
    userDelete
} = require('../controllers/admincontrol');
const json = require('json');
const path = require('path')
const gallery = require("../models/gallerymodel")
const fs = require("fs")
const announcemodel = require("../models/announcemodel");
const {Family, User, payments} = require('../models/usermodel');
const admin = require('firebase-admin');
const { getAllNotifications } = require('../controllers/usercontrol');


const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '-' + Math.random() + path.extname(file.originalname))
    }
});
var upload = multer({storage: storage});


/* GET users listing. */
router.get('/', function (req, res, next) {

    res.render('admin/adminlogin')
});
router.get('/home', function (req, res, next) {
    res.render('admin/adminhome', {admin: true})
});
router.get('/families', async function (req, res, next) {

    const users = await User.find({});
    const families = await Promise.all(users.map(async (user) => {
        const familyLength = user.Family.length;
        return {
            ...user.toObject(),
            familyLength
        };
    }));
    console.log(families);
    // res.render('admin/families',{admin:true,families})
    res.status(200).json()
});
router.get('/prayer', function (req, res, next) {
    res.render('admin/prayertime', {admin: true})
});

router.get('/events', function (req, res, next) {
    res.render('admin/events', {admin: true})
});
router.post('/save-event', upload.single('image'), function (req, res) {
    console.log(req.body);
    console.log(req.file);
    const newevent = new event({
        title: req.body.title,
        description: req.body.description,
        imagePath: path.normalize(req.file.path).replace(/\\/g, '/').replace("public", ""),
        date: req.body.date
    });


    newevent.save(function (err, event) {
        if (err) {
            return res.status(500).send(err);
        }

        res.status(200).json({status:200})
    });
});

router.get('/eventsview', (req, res) => {
    viewevents().then(events => {
      events.forEach((event) => {
        event.imagePath = `http://${process.env.APP_URL}${event.imagePath}`;
      });

        res.status(200).json({events});
        
    }).catch(err => {
        console.error(err);
        res.status(500).send({error: "Error fetching events"});
    });
});


router.get('/add-image', async (req, res) => {
    var images = await gallery.find({}).exec()
    res.render("admin/addimage", {
        admin: true,
        images
    })
})

router.delete("/delete-event/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await event.findByIdAndDelete(id);

       res.status(200).json({status:200})
    } catch (err) { // handle errors
        console.error(err);
        res.status(500).send('An error occurred while deleting the event.');
    }
})
router.get("/edit-event/:id", async (req, res) => {

    var event = await getevent(req.params.id)


    res.render("admin/editevent", {event})
})
router.post('/save-image', upload.single('file'), function (req, res) {

    console.log(req.file);
    const newimage = new gallery({

        imagePath: path.normalize(req.file.path).replace(/\\/g, '/').replace("public", "")

    })
    newimage.save(function (err, event) {
        if (err) {
            return res.status(500).send(err);
        }

        // res.redirect('/admin/add-image')
        res.status(200).json({message: "done"})
    })
})

router.get('/announcements', async (req, res) => {

    var users = await User.find({emailverified: true}).exec()


    res.render('admin/announcements', {
        admin: true,
        users
    })
})

router.delete('/imagedelete/:id', async (req, res) => {
    const id = req.params.id;
    const galleryitem = await gallery.findById(id).exec()
    const imagePath = galleryitem.imagePath
    console.log(imagePath);

    fs.unlink(`./public/${imagePath}`, async (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
        } else {
            await gallery.findByIdAndDelete(id)
            res.status(200).json({status:200})
        }


    })
});
router.post('/announce', (req, res) => {

    const {title, message} = req.body;

    // Create a new document using the model
    const newAnnounce = new announcemodel({title, message});

    // Save the document to the database
    newAnnounce.save((err) => {
        if (err) { // Handle any validation errors
            const validationErrors = Object.values(err.errors).map(error => error.message);
            res.redirect('error', {message: validationErrors})
        } else {
            res.redirect('/admin/announcements');
        }
    });

})
router.get('/payments/:id', async (req, res) => {

    const paymentschema = await payments.find({user: req.params.id})
    console.log(paymentschema);

    res.render('admin/payments', {
        admin: true,
        paymentschema
    })
}),
router.get('/members/:id', async (req, res) => {

    var family = await User.findById(req.params.id).populate({path: "Family", model: "Family"})

    var familymembers = family.Family

    console.log(familymembers);
    res.render('admin/members', {
        admin: true,
        familymembers
    })
}),

router.post('/send-notification', async (req, res) => {
    const { title, message, selectedUsers } = req.body;
    console.log(req.body);
  
    try {
      // If "Select All" is checked, retrieve all email-verified users' tokens
      let tokens = [];
      if (selectedUsers === 'all') {
        const users = await User.find({ emailverified: true });
        tokens = users.flatMap((user) => user.tokens);
      } else { // Find the specific user and retrieve their token
        const user = await User.findOne({ _id: selectedUsers });
        if (!user) {
          throw new Error('User not found');
        }
        tokens = user.tokens;
      }
  
      if (tokens.length === 0) {
        throw new Error('No valid tokens found');
      }
  
      // Remove any invalid tokens
      const response = await admin.messaging().sendMulticast({
        tokens,
        notification: {
          title: title,
          body: message
        }
      });
  
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(tokens[idx]);
        }
      });
  
      if (invalidTokens.length > 0) { // Remove invalid tokens from user's tokens array
        await User.updateMany({
          tokens: {
            $in: invalidTokens
          }
        }, {
          $pull: {
            tokens: {
              $in: invalidTokens
            }
          }
        });
      }
  
      // Call announce function only if notification is sent successfully
      announce(req.body);
  
      // Send JSON response if notification sent successfully
      res.json({
        message: 'Notification sent successfully'
      });
    } catch (error) {
      console.error(error);
  
      // Send appropriate error message in JSON response
      if (error.code === 'messaging/invalid-argument' && error.message === 'tokens must be a non-empty array') {
        res.status(400).json({
          error: 'No valid tokens found',
          message: 'No valid tokens found'
        });
      } else if (error.message === 'User not found') {
        res.status(404).json({
          error: 'User not found',
          message: 'User not found'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An internal server error occurred'
        });
      }
    }
  });
  
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find({emailverified:true});
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get('/user-members/:id', getusermembers)
router.get('/messages', getmessages)
router.get("/get-event/:id",geteditevent)

router.put('/update-event/:id', upload.single('image'), function (req, res) {
  const eventId = req.params.id;
  const updatedEvent = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date
  };
  
  if (req.file) {
    updatedEvent.imagePath = path.normalize(req.file.path).replace(/\\/g, '/').replace("public", "");
  } else {
    // If there's no new file, use the existing file path from the database
    event.findById(eventId, function (err, event) {
      if (err) {
        return res.status(500).send(err);
      }
      updatedEvent.imagePath = event.imagePath;
    });
  }

  event.findByIdAndUpdate(eventId, updatedEvent, function (err, event) {
      if (err) {
          return res.status(500).send(err);
      }

      res.status(200).json({status:200});
  });
});

router.get('/admin-notifications', getAdminNotifications)

router.post('/authlogin',loginauth)

router.post("/admin-signup",signupadmin)
router.get("/user-payments/:id",getuserpay)
router.put("/change-status/:id",changePaymentStatus)
router.delete('/delete-notification/:id',deleteNotification)
router.delete('/delete-message/:id',deleteMessage)
router.get('/dashboard',getUserDashboardData)
router.put("/change-admin-password",changeAdminPass)
router.put('/change-admin-username', changeAdminUsername)
router.delete('/delete-user/:id',userDelete)







module.exports = router;
