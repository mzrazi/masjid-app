const announcemodel = require("../models/announcemodel");
const event = require("../models/event");
const messagemodel = require("../models/messagemodel");
const { Family } = require("../models/usermodel");
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
      console.log(messages);
      res.json({ messages });
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
      console.log(formattedNotifications);
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
        res.status(200).json({ status: true, message: "Login successful", token: token });
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
}
}


  




  
  
  

      