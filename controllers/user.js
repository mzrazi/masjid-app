const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');

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
          from: '"masjid app" masjidappcc@gmail.com',
          to: userdata.Email,
          subject: 'Verify your email address',
          text: `Please click the following link to verify your email address: http://localhost:3000/verify-email/${token}`
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
          from: '"masjid app" masjidappcc@gmail.com',
          to: userdata.Email,
          subject: 'Verify your email address',
          text: `Please click the following link to verify your email address: http://localhost:3000/verify-email/${token}`
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
  }
}  


