const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');

module.exports={
  createUser: (req, res) => {
    var userdata = req.body;
    console.log(userdata);
    bcrypt.hash(userdata.Password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      const user = new User({
        Name: userdata.Name,
        Address: userdata.Address,
        Phone: userdata.Phone,
        Email: userdata.Email,
        Password: hash,
        emailverified: false
      });
      console.log(user);
      user.save((error) => {
        if (error) {
          console.log(error);
          return res.status(400).json({ error: error.message });
        }
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
console.log(process.env.MAILER_EMAIL);

const mailOptions = {
  from: '"masjid app" masjidappcc@gmail.com',
  to: userdata.Email,
  subject: 'Verify your email address',
  text: `Please click the following link to verify your email address: http://3.7.71.236:3000/verify-email/${token}`
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log(error); 
    return res.status(500).json({ error });
  }
  return res.status(201).json({ message: 'User created successfully, an email has been sent to verify the email address', user });
});

      
      });
    });
  },
  verifyEmail: (req, res) => {
    const token = req.params.token
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      User.findOneAndUpdate(
        { Email: decoded.email },
        { $set: { emailverified: true } },
        (err, user) => {
          if (err) {
            return res.status(500).json({ error: err ,message: "verification error"});
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


