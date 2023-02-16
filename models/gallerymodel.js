const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var gallerySchema = new mongoose.Schema({
    imagePath:{type:String,
        required:true,
        unique:true
      },
});

//Export the model
module.exports = mongoose.model('gallery', gallerySchema);