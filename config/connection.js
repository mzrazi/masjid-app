const mongoose = require('mongoose');

const dbConnect = async() => {
    try {
        await mongoose.connect("mongodb://localhost:27017", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            
        });
        mongoose.set('strictQuery', true)
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = dbConnect;