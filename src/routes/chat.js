const express = require("express");
const { userAuth } = require("../Middleware/auth");
const { chat: Chat } = require("../models/chat");

const Router = express.Router();

// GET chat with specific user
Router.get("/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    })
      .populate({ path: "messages.senderId", select: "firstName lastName photoUrl" })
      .populate({ path: "participants", select: "firstName lastName photoUrl" }); // ✅ Added photoUrl

    if (!chat) {
      chat = new Chat({ participants: [userId, targetUserId], messages: [] });
      await chat.save();

      // ✅ Re-populate after saving with photoUrl
      chat = await Chat.findById(chat._id).populate({
        path: "participants",
        select: "firstName lastName photoUrl",
      });
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST a new message
Router.post("/:targetUserId/message", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "Message text is required" });

  try {
    let chat = await Chat.findOne({ participants: { $all: [userId, targetUserId] } });

    if (!chat) {
      chat = new Chat({ participants: [userId, targetUserId], messages: [] });
    }

    chat.messages.push({ senderId: userId, text });
    await chat.save();

    await chat.populate([
      { path: "messages.senderId", select: "firstName lastName photoUrl" },
      { path: "participants", select: "firstName lastName photoUrl" }, // ✅ Added photoUrl here too
    ]);

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = Router;