const mongoose = require('mongoose');
const { Schema } = mongoose;

const FamilySchema = new Schema({
    Firstname: {
      type: String,
      required: true
    },
    Lastname:{
      type:String,
      required:true
    },
    Age: {
      type: String,
      required: true
    },
    Phone:{
      type:String,
      required:true
    },
    Gender:{
      type:String,
      required:true
    },
    User: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  })
  

  
const userSchema = new Schema({
    Name: { type: String, required: true },
    Address: { type: String, required: true },
    Phone: { type:String, required: true },
    Age:{type:String,required:true},
    Gender:{type:String,required:true},
   Email: { type: String, required: true, unique: true },
   Password: { type: String, required: true },
   resetToken:{ type:String },
   resetTokenExpiration:{type:String},
   emailverified: { type: Boolean, default: false},
   Family: [{ type: Schema.Types.ObjectId, ref: 'Family' }]
});

module.exports = {
    Family: mongoose.model("Family", FamilySchema),
    User: mongoose.model('User', userSchema),
  };
  
