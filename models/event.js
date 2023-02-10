var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
  title:{type:String,
    required:true,
    unique:true
  },
  imagePath:{type:String,
    required:true,
    unique:true
  },
  description:{type:String,
    required:true,
  },
  date:{
    type:String,
    required:true,
  }
});

module.exports = mongoose.model('event', eventSchema);
