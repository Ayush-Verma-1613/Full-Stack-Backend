const express = require('express');
const authRouter = express.Router();

const cookieParser = require('cookie-parser'); 
const {validateSignUpData} = require('../Utils/validation');// Import validation functions if needed
const User = require('../models/user');
const bcrypt = require('bcrypt'); // Import bcrypt for hashing passwords
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for creating and verifying tokens


authRouter.post('/login', async (req, res) => {

    try {

        // create a web token for the user after successful login
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error("Invalid Credential");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(isPasswordValid){



            const token = await jwt.sign({_id: user._id}, "DevTinder@00", {
                expiresIn: '7d' // Token will expire in 1 hour
            });// Sign the token with a secret key
            // console.log(token);
            console.log(token);

             res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // ✅ sirf production me true
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
// Set the token in a cookie
             
            res.send(user);
        }else{
            throw new Error("Invalid credentials");
        }
    } catch (error) {
        res.status(400).send("Error : " + error.message);
    }
})



authRouter.post('/signup', async (req, res) => {
    

    try {

        validateSignUpData(req);

        const {firstName, lastName, emailId, password, age, gender} = req.body;
        console.log("Request body:", req.body);

        // Hash the password before saving it to the database
        const passwordHash = await bcrypt.hash(password, 10); // 10 is the salt rounds
        // console.log(passwordHash);
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            age,
            gender,
        });

        await user.save();
        res.send('User created successfully');

    } catch (error) {
        res.send('Error creating user: Failed to create user');
    }
});

authRouter.post('/logout', async (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",   // match login
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),  // expiry set to past date
  });
  res.send("Logout Successfully");
});



module.exports = authRouter;