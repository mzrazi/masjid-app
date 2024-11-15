
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var event=require('../models/event')
const axios=require('axios')
const { Family, User, payments } = require('../models/usermodel');
const  mongoose=require('mongoose')
const message=require("../models/messagemodel")
const gallery=require("../models/gallerymodel")
const { v4: uuidv4 } = require('uuid');
const prayertime=require("../models/prayertimemodel")
const moment = require('moment');
const announcemodel = require('../models/announcemodel');
const { handleUserSignup } = require('./paymentcontrol');

 
module.exports={




  
  createUser: async (req, res) => {
    try {
      const userdata = req.body;
      console.log(userdata);
    
      // Check if the email already exists and is verified
      const existingVerifiedUser = await User.findOne({ 
        Email: userdata.Email, 
        emailverified: true 
      });
      if (existingVerifiedUser) {
        return res.status(400).json({status:400, message: 'User already exists' });
      }
    
      // Check if the email already exists but is not verified
      let existingUser = await User.findOne({ 
        Email: userdata.Email, 
        emailverified: false 
      });
    
      if (existingUser) {
        // Generate a new token
        const token = jwt.sign({ email: userdata.Email }, process.env.SECRET_KEY, {
          expiresIn: "1h"
        });
        const transporter = nodemailer.createTransport({
          host: 'smtp-relay.sendinblue.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASS 
          }
        });
        const mailOptions = {
          from: process.env.MAILER_EMAIL,
          to: userdata.Email,
          subject: 'Verify your email address',
          text: `Please click the following link to verify your email address:${process.env.APP_URL}/api/verify-email/${token}`
        };
    
        await transporter.sendMail(mailOptions);
        return res.status(201).json({ status:201,
          message: 'User already exists, a new verification email has been sent', 
          user: existingUser 
        });
      } else {
        // Hash the password
        const hash = await bcrypt.hash(userdata.Password, 10);
        // Create a new user
        const user = new User({ 
          FirstName: userdata.FirstName,
          LastName: userdata.LastName,
          Address: userdata.Address,
          Phone: userdata.Phone,
          Age:userdata.Age,
          Gender:userdata.Gender,
          Email: userdata.Email,
          Password: hash,
          emailverified: false
        });
    
        // Save the user
        await user.save();

      
        const token = jwt.sign({ email: userdata.Email }, process.env.SECRET_KEY, {
          expiresIn: "1h"
        });
        // Send an email with the token
        const transporter = nodemailer.createTransport({
          host: 'smtp-relay.sendinblue.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASS
          }
        });
      
        const mailOptions = {
          from: process.env.MAILER_EMAIL,
          to: userdata.Email,
          subject: 'Verify your email address',
          text: `Please click the following link to verify your email address:${process.env.APP_URL}/api/verify-email/${token}`
        };
        
        await transporter.sendMail(mailOptions);
        
        return res.status(201).json({ status:201,
          message: 'User created, verification email sent', 
          user  
        });
      }
     }catch (error) {
            return res.status(500).json({status:500, message: error.message });
       }
        },
        
    
       
  

        verifyEmail: (req, res) => {
          const token = req.params.token;
          jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
              if (err.name === "TokenExpiredError") {
                User.findOneAndDelete({ Email: decoded.email }, (err, user) => {
                  if (err) {
                    return res.status(500).json({ error: err, message: "Deletion error" });
                  }
                  if (!user) {
                    return res.status(401).json({ message: "User not found" });
                  }
                  return res.status(200).json({ status: 200, message: "User deleted due to expired token" });
                });
              } else {
                return res.status(401).json({ status: 401, message: "Invalid token" });
              }
            } else {
              User.findOneAndUpdate(
                { Email: decoded.email },
                { $set: { emailverified: true } },
                async (err, user) => {
                  if (err) {
                    return res.status(500).json({ status: 500, error: err, message: "Verification error" });
                  }
                  if (!user) {
                    return res.status(401).json({ status: 401, message: "User not found" });
                  }
                  await handleUserSignup(user); // call handleUserSignup function here
                  return res.status(200).json({ status: 200, message: "Email verified successfully" });
                }
              );
            }
          });
        },
        
        
        
  

  loginUser: (req, res) => {
    const { Email, Password} = req.body;
    console.log(Email)
    console.log(Password)
    User.findOne({ Email }, (err, user) => {
      if (err) {
        console.log(err);
        return res.status(500).json({status:500, message:"email error",error: err });
      }
      if (!user) {
        return res.status(401).json({status:401, message: "User not found" });
      }
      if (!user.emailverified) {
        return res.status(401).json({status:401, message: "Email not verified" });
      }
      bcrypt.compare(Password, user.Password, (error, result) => {
        if (error) {
          return res.status(401).json({status:401,message:"bcrypt error",err: error });
        }
        if (!result) {
          return res.status(401).json({status:401, message: "Incorrect password" });
        }

      
        
        user.save((err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({status:500, message:"token save error",error: err });
          }
          return res.status(200).json({status:200, message: "Login successful", user});
        });
      });
    });
  },

viewevents:async(req, res)=> {
  try {
    // Retrieve events from the database
    const events = await event.find({});
    events.forEach((event) => {
      event.imagePath = `http://${process.env.APP_URL}${event.imagePath}`;
    });

    // Check if current day's prayer time is available in the database
    const currentDate = moment().format('YYYY-MM-DD');
    const prayerTime = await prayertime.findOne({ date: currentDate });

    if (prayerTime) {
      // If prayer time is available, respond with events and prayer time
      res.json({
        status: 'success',
        message: 'Events and prayer time for the current day',
          events,
          prayerTime,
        
      })
    } else {
      // If prayer time is not available, fetch prayer times for the whole month from the API
      const url = `https://api.aladhan.com/v1/calendarByCity?city=Kochi&country=India&method=2`;
      let response;
      try {
        response = await axios.get(url);
      } catch (error) {
        throw new Error('Failed to fetch prayer times from the API');
      }

      // Save prayer times to the database
      const prayerTimes = response.data.data.map((day) => ({
        date: moment(day.date.readable).format('YYYY-MM-DD'),
        timestamp: day.date.timestamp,
        fajr: day.timings.Fajr,
        sunrise: day.timings.Sunrise,
        dhuhr: day.timings.Dhuhr,
        asr: day.timings.Asr,
        maghrib: day.timings.Maghrib,
        isha: day.timings.Isha,
      }));
      await prayertime.deleteMany({}); // Clear the collection
      await prayertime.insertMany(prayerTimes);

      // Respond with events and prayer time for the current day
      const prayerTime = await prayertime.findOne({ date: currentDate });
      res.json({
        status: 'success',
        message: 'Events and prayer time for the current day',
          events,
          prayerTime,
        
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
},



  editProfile: async (req, res) => {
    try {
      // Find user by id
      var updates = req.body;
      console.log(updates);
      var ID= req.body.UserId
  
      const user = await User.findById(ID)
      if (!user) {
        return res.status(404).json({status:404, message: "user not found" });
      }
  
      // Update user details
      const updatedUser = await User.findOneAndUpdate(
        { _id: ID },
        { $set:updates},
        { new: true }
      );
  
      return res.status(200).json({status:200, message: "Profile updated successfully",updatedUser});
    } catch (error) {
      console.error(error);
      return  res.status(500).json({status:500,message:"error updating profile",err:error});
    }
  }
  ,

 

  changePassword: async (req, res) => {
    try {
      
  
      var id = req.body.UserId;
      var Password=req.body.Password
      var newPassword = req.body.newPassword;
  
      var curuser = await User.findOne({ _id:id }).exec();
    
      var hash = curuser.Password;
      
  
      // Check if the current password provided by the user matches the password stored in the database
      const isPasswordCorrect = await bcrypt.compare(Password, hash);
      console.log(isPasswordCorrect);
      if (!isPasswordCorrect) {
        return res.status(404).json({status:404,
          message: "current password is incorrect"
        });
      }
  
      // Hash the new password
      var hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password in the database
      await User.findOneAndUpdate(
        { _id:id },
        { $set: { Password:hashedPassword } },
        { new: true }
      );
  
      res.status(200).json({status:200,
        message: "password updated succesfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
       status:500, message: "password update error"});
    }
  },
  addfamily:(req,res)=>{
    User.findById(req.body.UserId)
    .then(user => {
      if (!user) {
        return res.status(404).json({status:404, success: false, message: 'User not found' });
      }
      const newFamilyMember = new Family({
        Firstname: req.body.Firstname,
        Lastname: req.body.Lastname,
        Age: req.body.Age,
        Phone: req.body.Phone,
        Gender: req.body.Gender,
        User: user._id
      });
      return newFamilyMember.save()
      .then(familyMember => {
        user.Family.push(familyMember._id);
        return user.save()
        .then(() => res.status(200).json({status:200, success: true, message: 'Family member added successfully',newFamilyMember }))
        .catch(err => res.status(500).json({status:500, success: false, message: 'Error adding family member', error: err }));
      })
      .catch(err => res.status(500).json({status:500, success: false, message: 'Error creating family member', error: err }));
    })
    .catch(err => res.status(500).json({status:500, success: false, message: 'Error finding user', error: err }));
    
  },

  viewall:(req,res)=>{
    User.find()
    .populate({
        path: "Family",
        model: "Family"
    })
    .then(user => {
      return res.status(200).json({status:200,message:"succesful", user });
    })
    .catch(err => {
      console.log(err);
     return  res.status(500).json({status:500,message:"unsuccesful",error:err});
      
    });
  },

  viewuserfamily: (req, res) => {
    User.findById(req.body.UserId)
      .populate({
        path: "Family",
        model: "Family"
      })
      .then(user => {
        if (!user) {
          return res.status(404).json({
            status: 404,
            message: "User not found"
          });
        }
        return res.status(200).json({
          status: 200,
          message: "Successful",
          user
        });
      })
      .catch(err => {
        console.log(err);
        return res.status(500).json({
          status: 500,
          message: "Unsuccessful,invalid id",
          error: err
        });
      });
  }
  ,
  userdetails:(req,res)=>{
    var id = req.body.UserId
    
    User.findById(id).exec((err, user) => {
      if (err) {
        return res.status(500).json({status:500, message: "Error retrieving user" });
      }
      if (!user) {
        return res.status(404).json({status:404, message: "User not found" });
      }
      return res.status(200).json({status:200,message:"succesful", user });
    });
  }
  ,
  savemessage:async(req,res)=>{

    var msg=req.body

    

    var newmessage=new message({
      title:msg.title,
      useremail:msg.email,
      message:msg.message,
    })
    try {
      
      newmessage.save().then((doc)=>{
        res.status(200).json({status:200,message:"succesfull"})
      }).catch((err)=>{
        res.status(404).json({status:404,message:err.message})
      })
    } catch (error) {

      res.status(500).json({status:500,message:"internal error",err:error})
    }



  },

  editfamily:async(req,res)=>{
    try {
      // Find user by id
      var updates = req.body;
      var ID= req.body.memberId
  
      const user = await Family.findById(ID)
      if (!user) {
        return res.status(404).json({status:404, message: "user not found" });
      }
  
      // Update user details
      const updatedUser = await Family.findOneAndUpdate(
        { _id: ID },
        { $set:updates},
        { new: true }
      );
  
      return res.status(200).json({status:200, message: "member updated successfully",updatedUser});
    } catch (error) {
      console.error(error);
      return  res.status(500).json({status:500,message:"error updating member",err:error});
    }

},
deletefamily:(req,res)=>{
  Family.findById(req.body.memberId)
  .then(familyMember => {
    if (!familyMember) {
      return res.status(404).json({status: 404, success: false, message: 'Family member not found'});
    }
    User.findByIdAndUpdate(familyMember.User, { $pull: { Family: familyMember._id }})
      .then(() => {
        return familyMember.remove()
          .then(() => res.status(200).json({status: 200, success: true, message: 'Family member deleted successfully'}))
          .catch(err => res.status(500).json({status: 500, success: false, message: 'Error deleting family member', error: err}));
      })
      .catch(err => res.status(500).json({status: 500, success: false, message: 'Error removing family member ID from User', error: err}));
  })
  .catch(err => res.status(500).json({status: 500, success: false, message: 'Error finding family member', error: err}));


      
},

getimages:async(req,res)=>{
  try{
  var images= await gallery.find({});
  images.forEach(image => {
    image.imagePath = `http://${process.env.APP_URL}${image.imagePath}`;
  });
  res.status(200).json({status:200,message:"succesful",images})
  
    } catch (error) {

      console.error(error);
      res.status(500).json({status:500,message:"unsuccesful",err:error})
    }
},

forgotpassword:async (req, res) => {
    const { email } = req.body;
    console.log(req.body);
  
    try {
      // Find user by email
      const user = await User.findOne({ Email:email });
      console.log(user);
      // If user not found, return error
      if (!user) {
        return res.status(404).json({status:404, message: 'User not found' });
      }
  
      // Generate password reset token
      const resetToken = uuidv4();
  
      // Update user's reset token and expiration time in the database
      user.resetToken = resetToken;
      user.resetTokenExpiration = Date.now() + 3600000; // 1 hour from now
      await user.save();
  
      // Send password reset email to user
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.sendinblue.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILER_EMAIL,
          pass: process.env.MAILER_PASS
        }
      });
  
      const mailOptions = {
        from: process.env.MAILER_EMAIL,
        to: email,
        subject: 'Reset Your Password',
        html: `<p>Please click <a href="${process.env.APP_URL}/verify-token/${resetToken}">here</a> to reset your password.</p>`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({status:500, message: 'Failed to send password reset email' });
        } else {
          console.log('Password reset email sent:', info.response);
          return res.status(200).json({status:200, message: 'Password reset email sent' });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({status:500, message: 'Server error' });
    }
},

verifytoken:async (req, res) => {
  const { resetToken } = req.params;
  console.log("toke:"+resetToken);

  try {
    // Find user by reset token
    const user = await User.findOne({ resetToken, resetTokenExpiration: { $gt: Date.now() } });
    console.log(user);

    // If user not found or reset token expired, redirect to forgot password page with error message
    if (!user) {
      return res.status(404).json({status:404,message:'error=invalid-token'});
    }
    console.log(resetToken);
    // Render password reset page with reset token
    res.status(200).json({status:200,message:'verified'});
  } catch (error) {
    console.error(error);
    return res.status(500).json({status:500, message: 'Server error' });
  }
},


resetpassword:async (req, res) => {
  const newPassword = req.body.newPassword;
 const resetToken=req.params.resetToken
  console.log(newPassword);

  try {
    // Find user by reset token
    const user = await User.findOne({ resetToken, resetTokenExpiration: { $gt: Date.now() } });
    console.log(user)
    // If user not found or reset token expired, return error
    if (!user) {
      return res.status(404).json({ message: 'Invalid reset token' });
    }

    // Hash new password
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and reset token in the database
    user.Password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    // Redirect to login page with success message
    return res.status(200).json({status:200,message:'password reset success'});
  } catch (error) {
    console.error(error);
    return res.status(500).json({status:500, message: 'Server error' });
  }
},
getuserpayment:(req, res) => {
  const userId = req.body.userId;
  const currentYear = new Date().getFullYear();

  

  User.findById(userId, (err, user) => {
    if (err) {
      return res.status(500).json({ status: 500, message: "Error retrieving user" });
    }
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    payments.find({ user: userId, year: currentYear }).exec((err, payment) => {
      if (err) {
        return res.status(500).json({ status: 500, message: "Error retrieving payment" });
      }

      return res.status(200).json({ status: 200, message: "Success", payment });
    });
  });
},





 getPrayerTimesForMonth:async(req, res) =>{
  
 
    try {
      // Check if prayer times for the current month are available in the database
      const currentDate = moment().startOf('month').format('YYYY-MM-DD');
      const prayerTime = await prayertime.findOne({ date: currentDate });
  
      if (prayerTime) {
        // If prayer times are available, respond with prayer times for the whole month
        const month = moment().startOf('month');
        const prayerTimes = await prayertime.find({});
        res.json({
          status: 'success',
          message: 'Prayer times for the whole month',
          data: {
            prayerTimes,
          },
        });
      } else {
        // If prayer times are not available, fetch prayer times for the whole month from the API
        const url = `https://api.aladhan.com/v1/calendarByCity?city=Kochi&country=India&method=2`;
        let response;
        try {
          response = await axios.get(url);
        } catch (error) {
          throw new Error('Failed to fetch prayer times from the API');
        }
  
        // Save prayer times to the database
        const prayerTimes = response.data.data.map((day) => ({
          date: moment.parseZone(day.date.readable).format('YYYY-MM-DD'),
          timestamp: day.date.timestamp,
          fajr: day.timings.Fajr,
          sunrise: day.timings.Sunrise,
          dhuhr: day.timings.Dhuhr,
          asr: day.timings.Asr,
          maghrib: day.timings.Maghrib,
          isha: day.timings.Isha,
        }));
        await prayertime.deleteMany({}); // Clear the collection
        await prayertime.insertMany(prayerTimes);
  
        // Respond with prayer times for the whole month
        const month = moment().startOf('month');
        const prayerTimesForMonth = await prayertime.find({});
        res.json({
          status: 'success',
          message: 'Prayer times for the whole month saved and send',
          data: {
            prayerTimes: prayerTimesForMonth,
          },
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  },

  generatePaymentSchemasForUsers:async (req,res)=> {
    const users = await User.find();
  
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
  
    for (const user of users) {
      const existingPayment = await payments.findOne({ user: user._id, year: currentYear, month: currentMonth });
      if (!existingPayment) {
        const payment = new payments({
          user: user._id,
          year: currentYear,
          month: currentMonth,
          status: 'pending'
        });
        await payment.save();
      }
    }
    res.send("done")
  },
  getPaymentStatus : async (req, res) => {
    try {
      const userId = req.body.userId;
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  
      const currentMonthPaymentData = await payments.findOne({ user: userId, month: currentMonth, year: currentYear });
      const previousMonthPaymentData = await payments.findOne({ user: userId, month: previousMonth, year: previousYear });
  
      if (!currentMonthPaymentData && !previousMonthPaymentData) {
        return res.status(404).json({ message: 'Payment data not found for current and previous month', status: 'error' });
      }
  
      const paymentData = {
        currentMonth: currentMonthPaymentData ? currentMonthPaymentData : { message: 'Payment data not found for current month', status: 'info' },
        previousMonth: previousMonthPaymentData ? previousMonthPaymentData : { message: 'Payment data not found for previous month', status: 'info' }
      };
  
      res.json({ message: 'Payment data found', status: 'success', data: paymentData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching payment data', status: 'error' });
    }
  },

 

 getAllPaymentStatuses:async(req, res) =>{
  try {
    const userId = req.body.userId;
    const paymentStatuses = await payments.find({ user: userId }).sort({ year: -1, month: -1 });
    if (!paymentStatuses) {
      return res.status(404).json({ message: 'No payment statuses found for this user', status: 'error' });
    }
    return res.status(200).json({ paymentStatuses: paymentStatuses, message: 'Payment statuses found', status: 'success' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving payment statuses', status: 'error' });
  }
},


getAllNotifications:async(req,res)=>{
  
    const { userId } = req.body;
  
    try {
      const announcements = await announcemodel
        .find({ $or: [{ user: userId }, { user: 'all' }] })
        .sort({ createdAt: -1 })
        .exec();
  
      if (announcements.length === 0) {
        return res.status(404).json({ success: false, message: 'notifications not found for user' });
      }
  
      return res.status(200).json({ success: true, data: announcements });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
  }
  





  
  
  
  
}








