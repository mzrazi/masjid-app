const announcemodel = require("../models/announcemodel");
const event = require("../models/event");
const messagemodel = require("../models/messagemodel");
const { Family, User, payments } = require("../models/usermodel");
const admin =require("../models/adminmodel")
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');




module.exports={

  viewevents: async() => {
    try {
      const events = await event.find({});
      return events;
    } catch (error) {
      console.error(error);
      throw new Error('Error getting events');
    }
  },
  
  deleteevent: async (id) => {
    try {
      const deletedEvent = await event.findByIdAndDelete(id);
      if (!deletedEvent) {
        throw new Error('Event not found');
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  
  getevent: async (id) => {
    try {
      const newevent = await event.findById(id);
      if (!newevent) {
        throw new Error('Event not found');
      }
      return newevent;
    } catch (error) {
      console.error(error);
      throw new Error('Error getting event');
    }
  },

  announce:(data)=>{
    
    const { title, message,selectedUsers} = data;

  // Create a new document using the model
  const newAnnounce = new announcemodel({ title, message,user:selectedUsers });

  // Save the document to the database
  newAnnounce.save((err) => {
    if (err) {
      // Handle any validation errors
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return validationErrors
    } else {
     return true
    }
  });
  },

  getusermembers:async (req, res)=> {
    const  id  = req.params.id
    console.log(id);
    
    try {
      const members = await Family.find({ User: id });
      console.log(members);
      res.json({ members });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },

  getmessages:async(req,res)=>{
    try {
      const messages = await messagemodel.find({ })
   
      res.status(200).json({ messages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },
  geteditevent: async (req, res) => {
    try {
      const id = req.params.id;
      console.log(id);
      const events = await event.findById(id);
      console.log(events);
      events.imagePath = `http://${process.env.APP_URL}${events.imagePath}`;
      res.status(200).json({ events });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },
  getAdminNotifications:async(req,res)=>{
    try {
      const notifications = await announcemodel.find({ })
      const formattedNotifications = notifications.map(notification => ({
        ...notification._doc,
        createdAt: notification.createdAt.toLocaleString(),
        updatedAt: notification.updatedAt.toLocaleString(),
      }));
      
      res.status(200).json({ notifications: formattedNotifications });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },

  loginauth: (req, res) => {
    const { username, password } = req.body;
    admin.findOne({ username }, (err, admin) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ status: false, message: "username error", error: err });
      }
      if (!admin) {
        return res.status(401).json({ status: false, message: "User not found" });
      }
      bcrypt.compare(password, admin.password, (error, result) => {
        if (error) {
          return res.status(401).json({ status: false, message: "bcrypt error", err: error });
        }
        if (!result) {
          return res.status(401).json({ status: false, message: "Incorrect password" });
        }
  
        // If the username and password are valid, generate a JWT token and send it to the client
        const payload = {
          username: admin._id
        };
        const token = jwt.sign(payload,process.env.SECRET_KEY, { expiresIn: '1h' });
        console.log(token);
        res.status(200).json({ status: true, message: "Login successful", token: token,id:admin._id });
      });
    });
  },

signupadmin:async(req,res)=>{
  try {
    const { username, password,email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const Admin = new admin({
      username,
      password: hashedPassword,
      email
    });
    await Admin.save();
    res.status(201).json({ message: 'Admin credentials added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
},

getuserpay:(req, res) => {
  const userId = req.params.id;
  const currentYear = new Date().getFullYear();
console.log();
  

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
  
      const paymentsWithMonthName = payment.map(p => {
        const date = new Date(p.createdAt);
        const monthName = date.toLocaleString('default', { month: 'long' }); // Get month name
        return { ...p._doc, month: monthName }; // Return payment object with month name added
      });
     
      return res.status(200).json({ status: 200, message: "Success", paymentsWithMonthName ,user});
    });
  });

  
},
changePaymentStatus: (req, res) => {
  const id = req.params.id;
  const status = req.body.status;

  payments.findByIdAndUpdate(id, { status: status }, { new: true })
    .then(updatedPayment => {
      res.status(200).json(updatedPayment);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Error updating payment status" });
    });
},

deleteMessage:async(req,res)=>{
  const { id } = req.params;
  try {
    const deletedMessage = await messagemodel.findByIdAndDelete(id);
    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }
    return res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
},

deleteNotification:async(req,res)=>{

  const { id } = req.params;
  try {
    const deletednotification = await announcemodel.findByIdAndDelete(id);
    if (!deletednotification) {
      return res.status(404).json({ error: " not found" });
    }
    return res.json({ message: " deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
},

 getUserDashboardData :async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const familyCount = await Family.countDocuments();
    const messageCount = await messagemodel.countDocuments();
    const notificationCount = await announcemodel.countDocuments();
    const eventCount = await event.countDocuments();
    console.log(eventCount);
    res.status(200).json({
      userCount,
      familyCount,
      messageCount,
      notificationCount,
      eventCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
},
changeAdminPass:async(req,res)=>{
 
    try {
      console.log(req.body);
      
  
      var id = req.body.userId;
      var Password=req.body.currentPassword
      var newPassword = req.body.newPassword;
  
      var curuser = await admin.findOne({ _id:id })
    
      var hash = curuser.password;
      console.log(hash);
      
  
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
      await admin.findOneAndUpdate(
        { _id:id },
        { $set: { password:hashedPassword } },
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
  changeAdminUsername: async (req, res) => {
    try {
      console.log("called");
      // Find user by id
      var {username}= req.body
      console.log(username);
      
      var ID= req.body.userId
  
      const user = await admin.findById(ID)
      console.log(user);
      if (!user) {
        return res.status(404).json({status:404, message: "user not found" });
      }
  
      // Update user details
      const updatedUser = await admin.findOneAndUpdate(
        { _id: ID },
        { $set:{username}},
        { new: true }
      );
  
      return res.status(200).json({status:200, message: "Profile updated successfully",updatedUser});
    } catch (error) {
      console.error(error);
      return  res.status(500).json({status:500,message:"error updating profile",err:error});
    }
  },
  userDelete:async(req,res)=>{
    const { id } = req.params;
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({ message: "Userdeleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  },

  }








  




  
  
  

