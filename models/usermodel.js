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
     
    },
    User: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  })
  

  
const userSchema = new Schema({
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
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
})

const PaymentStatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  months: [{
    month: {
      type: String,
      enum: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
      required: true,
    },
    status: {
      type: String,
      enum: ['default', 'pending', 'due', 'paid'],
      default: 'default',
      required: true,
    }
  }],
});



module.exports = {
    Family: mongoose.model("Family", FamilySchema),
    User: mongoose.model('User', userSchema),
   payments: mongoose.model('PaymentStatus', PaymentStatusSchema)
  };
  
