const express = require('express');
const profileRouter = express.Router();
const User = require('../models/user');
const { validateEditProfileData } = require('../Utils/validation');
const { userAuth } = require('../Middleware/auth');
const bcrypt = require('bcrypt');

// GET /profile
profileRouter.get('/', userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.send(user);
    } catch (error) {
        res.status(400).send("ERROR : " + error.message);
    }
});

// PATCH /profile/edit
// profileRouter.patch("/edit", userAuth, async (req, res) => {
//   try {
//     if (!validateEditProfileData(req)) {
//       throw new Error("Invalid Edit Request");
//     }

//     const loggedInUser = req.user;

//     Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

//     await loggedInUser.save();

//     res.json({
//       message: `${loggedInUser.firstName}, your profile updated successfuly`,
//       data: loggedInUser,
//     });
//   } catch (err) {
//     res.status(400).send("ERROR : " + err.message);
//   }
// });

profileRouter.put("/edit", userAuth, async (req, res) => {
  try {
    // Log for debugging
    
    // Validate allowed fields
    const isValid = validateEditProfileData(req);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid fields in request" });
    }

    // Update allowed fields only
    const allowedFields = [
      "firstName",
      "lastName",
      "emailId",
      "photoUrl",
      "gender",
      "age",
      "about",
      "skills",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    res.status(200).json({
      message: `${req.user.firstName}, your profile was updated successfully.`,
      data: req.user,
    });
  } catch (err) {
    console.error("PATCH /profile/edit error:", err.message);
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});


// PATCH /profile/password
profileRouter.put('/change-password', userAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Old and new passwords are required." });
    }

    try {
        const user = req.user;

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Old password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
});


profileRouter.delete('/delete-account', userAuth, async (req, res) => {
    try {
        const user = req.user;
        await user.deleteOne(); // or user.remove() depending on your Mongoose version
        
        res.status(200).json({ message: "Account deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
});
module.exports = profileRouter;
