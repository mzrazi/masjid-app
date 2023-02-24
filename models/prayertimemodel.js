const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model



const prayerTimeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timestamp: 
  { type: Number,
   required: true },
  fajr: {
    type: String,
    required: true
  },
  sunrise: {
    type: String,
    required: true
  },
  dhuhr: {
    type: String,
    required: true
  },
  asr: {
    type: String,
    required: true
  },
  maghrib: {
    type: String,
    required: true
  },
  isha: {
    type: String,
    required: true
  }
});





//Export the model
module.exports = mongoose.model('prayertime', prayerTimeSchema);