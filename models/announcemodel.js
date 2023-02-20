const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var announceSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
       
    }, 
    message:{
        type:String,
        required:true,
       
    }
    
});

//Export the model
module.exports = mongoose.model('announce', announceSchema);