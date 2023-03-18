const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var adminSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    password:{
        type:String,
        required:true,
    },
    email:{
        type:String
    }
});

//Export the model
module.exports = mongoose.model('admin', adminSchema);