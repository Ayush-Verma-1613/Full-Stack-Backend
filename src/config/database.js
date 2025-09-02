const mongoose = require('mongoose');
const env = require('dotenv');
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/Dev-Tinder/src/.env' });

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);

};

module.exports = connectDB;