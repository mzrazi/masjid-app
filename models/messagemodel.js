const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var messageSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        
    },
    useremail:{
        type:String,
        required:true,
       
    },
    message:{
        type:String,
        required:true,
       
    },
},{
    timestamps:true
});

//Export the model
module.exports = mongoose.model('message', messageSchema);