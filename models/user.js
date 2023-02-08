const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    Name: { type: String, required: true },
    Address: { type: String, required: true },
    Phone: { type:String, required: true },
   Email: { type: String, required: true, unique: true },
   Password: { type: String, required: true },
   emailverified: { type: Boolean, default: false}
});

module.exports = mongoose.model('User', userSchema);
