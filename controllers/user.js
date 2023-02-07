const User = require('../models/user');
const bcrypt = require('bcrypt');


module.exports={
createUser : (req, res) => {
  var userdata = req.body;
  console.log(userdata);
  bcrypt.hash(userdata.Password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    const user = new User({Name:userdata.Name,Address:userdata.Address,Phone:userdata.Phone, Email:userdata.Email, Password: hash });
    console.log(user);
    user.save((error) => {
      if (error) {
        console.log(error);
        return res.status(400).json({ error });
        
      }
      return res.status(201).json({ message: 'User created successfully' });
    });
  });
},

 loginUser :(req, res) => {
  const { Email, Password } = req.body;
  User.findOne({ Email }, (err, user) => {
    if (err) {
        console.log(err);
      return res.status(500).json({ error: err });
    }
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    bcrypt.compare(Password, user.Password, (error, result) => {
      if (error) {
        return res.status(401).json({ error });
      }
      if (!result) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
      return res.status(200).json({ message: 'User logged in successfully' });
    });
  });
}
}


