const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 20,
        trim: true,
    },
    lastName: {
        type: String,
        minLength: 2,
        maxLength: 20,

    },
  age: {
  type: Number,
  default: 18, // ✅ default age
  min: 18,
  validate(value) {
    if (value < 18) {
      throw new Error("Age must be at least 18");
    }
  },
},
gender: {
  type: String,
  default: "N/A", // ✅ default gender
  validate(value) {
    const validGenders = ["male", "female", "other"];
    if (!value || !validGenders.includes(value.toLowerCase())) {
      throw new Error("Invalid gender");
    }
  },
},
    emailId: {
        type: String,
        lowerCase: true,
        required: true,
        unique: true,
        trim: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid email address');
            }
        }
    },
    password: {
        type: String,
        required: true,
        validator(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error('Enter a Strong Password');
            }
        }
    },
   photoUrl: {
    type: String,
    default: "https://cdn.pfps.gg/pfps/2903-default-blue.png",
    validate(value) {
        // Allow both URLs and base64 data URIs
        if (value.startsWith('data:image/')) {
            // Base64 image data URI - no validation needed
            return true;
        } else if (!validator.isURL(value)) {
            throw new Error('Invalid URL or image data');
        }
    }
},
    
    about: {
        type: String,
        default: "Hello, I am using this app!",
        
    },
    skills: {
  type: [String],
  default: "NO SKILLS ADDED YET",
},
resetToken: {
        type: String
    },
    resetTokenExpires: {
        type: Date
    },
},
    {
        timestamps: true,

    });


module.exports = mongoose.model('User', userSchema);