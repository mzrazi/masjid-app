const User = require('../models/usermodel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var event=require('../models/event')
const axios=require('axios')

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
        return res.status(400).json({ message: 'User already exists' });
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
        // Send a new email with the new token
        const transporter = nodemailer.createTransport({
          host: 'smtp.zoho.in',
          port: 465,
          secure: true,
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASSWORD
          }
        });
    
        const mailOptions = {
          from: '"masjid app" masjidapp1@zohomail.in',
          to: userdata.Email,
          subject: 'Verify your email address',
          text: `Please click the following link to verify your email address: http://3.7.71.236:3000/verify-email/${token}`
        };
    
        await transporter.sendMail(mailOptions);
        return res.status(201).json({ 
          message: 'User already exists, a new verification email has been sent', 
          user: existingUser 
        });
      } else {
        // Hash the password
        const hash = await bcrypt.hash(userdata.Password, 10);
        // Create a new user
        const user = new User({
          Name: userdata.Name,
          Address: userdata.Address,
          Phone: userdata.Phone,
          Email: userdata.Email,
          Password: hash,
          emailverified: false
        });
    
        // Save the user
        await user.save();
    
        // Generate a token
        const token = jwt.sign({ email: userdata.Email }, process.env.SECRET_KEY, {
          expiresIn: "1h"
        });
        // Send an email with the token
        const transporter = nodemailer.createTransport({
          host: 'smtp.zoho.in',
          port: 465,
          secure: true,
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASSWORD
          }
        });
        const mailOptions = {
          from: '"masjid app" masjidapp1@zohomail.in',
          to: userdata.Email,
          subject: 'Verify your email address',
          text: `Please click the following link to verify your email address: http://3.7.71.236:3000/verify-email/${token}`
        };
        
        await transporter.sendMail(mailOptions);
        
        return res.status(201).json({ 
          message: 'User created, verification email sent', 
          user  
        });
      }
     }catch (error) {
            return res.status(500).json({ message: error.message });
       }
        },
        
    
       
  

  verifyEmail: (req, res) => {
    const token = req.params.token;
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          User.findOneAndDelete({ email: decoded.Email }, (err, user) => {
            if (err) {
              return res.status(500).json({ error: err, message: "Deletion error" });
            }
            if (!user) {
              return res.status(401).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "User deleted due to expired token" });
          });
        } else {
          return res.status(401).json({ message: "Invalid token" });
        }
      }
      User.findOneAndUpdate(
        { Email: decoded.email },
        { $set: { emailverified: true } },
        (err, user) => {
          if (err) {
            return res.status(500).json({ error: err, message: "Verification error" });
          }
          if (!user) {
            return res.status(401).json({ message: "User not found" });
          }
          return res.status(200).json({ message: "Email verified successfully" });
        }
      );
    });
  },
  
  

  loginUser: (req, res) => {
    const { Email, Password } = req.body;
    User.findOne({ Email }, (err, user) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: err });
      }
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (!user.emailverified) {
        return res.status(401).json({ message: "Email not verified" });
      }
      bcrypt.compare(Password, user.Password, (error, result) => {
        if (error) {
          return res.status(401).json({ error });
        }
        if (!result) {
          return res.status(401).json({ message: "Incorrect password" });
        }
        // // Create a JSON web token
        // const token = jwt.sign({ Email: user.Email }, process.env.SECRET_KEY, {
        //   expiresIn: "1h"
        // });
        return res.status(200).json({ message: "Login successful", user});
      });
    });
  },



  // viewevents:(req,res)=>{

  //   event.find({}, function(err, events) {
  //       if (err) {
  //         return res.status(500).send(err);
  //       }
    
  //       res.status(200).json(events);
  //     });
  //   }


 viewevents:async(req,res)=> {
    try {
      
      const prayerTimesResponse = await axios.get('https://api.aladhan.com/v1/calendarByCity?city=Kochi&country=India&method=2');
  
      var events = await event.find({})
      const prayerTimes = prayerTimesResponse.data


      console.log(events);
      console.log(prayerTimes);
     res.status(200).json({events,prayerTimes})
    } catch (error) {

      console.error(error);
      res.status(500).json(error)
    }
  },

  editProfile: async (req, res) => {
    try {
      // Find user by email
      var updates = req.body;
      var email = req.body.email;

      console.log(updates);
      const user = await User.findOne({ email: email });
      if (!user) {
        res.status(404).json({ message: "user not found" });
      }
  
      // Update user details
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { $set:updates},
        { new: true }
      );
  
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating profile" });
    }
  },

 

  changePassword: async (req, res) => {
    try {
      console.log(req.body);
  
      var email = req.params.email;
      var Password=req.body.Password
      var newPassword = req.body.newPassword;
  
      var curuser = await User.findOne({ Email: email }).exec();
    
      var hash = curuser.Password;
      
  
      // Check if the current password provided by the user matches the password stored in the database
      const isPasswordCorrect = await bcrypt.compare(Password, hash);
      console.log(isPasswordCorrect);
      if (!isPasswordCorrect) {
        return res.status(404).json({
          error: "current password is incorrect"
        });
      }
  
      // Hash the new password
      var hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password in the database
      await User.findOneAndUpdate(
        { Email: email },
        { $set: { Password:hashedPassword } },
        { new: true }
      );
  
      res.status(200).json({
        message: "password updated succesfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "password update error"});
    }
  }
  
  
  
  
}  


