const express = require('express');
const http = require("http"); // Needed to attach Socket.IO
const { Server } = require("socket.io");
const connectDB = require('./config/database');
const app = express();
const User = require('./models/user');
const { chat: Chat } = require("./models/chat");



const cookieParser = require('cookie-parser'); // Import cookie-parser for handling cookies
const cors = require("cors");
const bcrypt = require('bcrypt'); // Const bcrypt for hashing passwords.(hidden text of passwords)

app.use(express.json({ limit: '100mb' })); // Increased limit
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());//Middleware that converts json format to javascript.
app.use(cookieParser());//Middleware to parse cookies from the request.

// Salt --> A random string added to the password before hashing to make it more secure.

//post Api - Post /signup

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestsRouter = require('./routes/requests');
const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');

// Login Api - Post /login

app.use('/', authRouter);
app.use('/profile', profileRouter);
app.use('/chat', chatRouter);
app.use('/', requestsRouter);
app.use('/', userRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// 🎯 FIXED SOCKET IMPLEMENTATION
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining their room
  socket.on("joinRoom", (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  });

  // 🔥 FIXED: Handle message sending without duplicates
  socket.on("sendMessage", async ({ senderId, targetUserId, text }) => {
    console.log(`Message from ${senderId} to ${targetUserId}: ${text}`);
    
    if (!text || !senderId || !targetUserId) {
      console.log('Invalid message data received');
      return;
    }

    try {
      // Find or create chat
      let chat = await Chat.findOne({ 
        participants: { $all: [senderId, targetUserId] } 
      });
      
      if (!chat) {
        chat = new Chat({ 
          participants: [senderId, targetUserId], 
          messages: [] 
        });
      }

      // Add the new message
      chat.messages.push({ 
        senderId, 
        text,
        createdAt: new Date() // Ensure timestamp is set
      });
      
      await chat.save();
      
      // Populate sender information
      await chat.populate({ 
        path: "messages.senderId", 
        select: "firstName lastName" 
      });

      // 🎯 KEY FIX: Only emit to TARGET user, not sender
      // Sender already has the message from optimistic update
      io.to(targetUserId).emit("newMessage", chat);
      
      // Optional: Send delivery confirmation to sender
      socket.emit("messageDelivered", { 
        messageId: chat.messages[chat.messages.length - 1]._id,
        success: true,
        timestamp: new Date()
      });
      
      console.log(`Message delivered to ${targetUserId}`);
      
    } catch (error) {
      console.error('Socket sendMessage error:', error);
      
      // Send error notification to sender
      socket.emit("messageError", { 
        error: "Failed to send message",
        originalText: text,
        targetUserId: targetUserId
      });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

//get Api - Get /users
app.get('/users', async (req, res) => {
    const useremailId = req.body.emailId;

    try {
        const users = await User.find({ emailId: useremailId });
        if (users.length === 0) {
            res.status(404).send("User not found");
        } else {
            res.status(200).send(users);
        }
    } catch (error) {
        res.status(500).send("Error fetching user:" + error.message);
    }
});

// Feed Api - Get /feed
// app.get('/feed', async (req, res) => {
//     try {
//         const feed = await User.find({});
//         res.send(feed);

//     } catch (error) {
//         res.status(500).send("Error fetching feed:" + error.message);
//     }
// })

//Delete Api - Delete /users
app.delete('/users', async (req, res) => {
    const userId = req.body.userId;

    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).send("User not found");
        } else {
            res.status(200).send("User deleted successfully");
        }
    } catch (error) {
        res.status(500).send("Error deleting user:" + error.message);
    }
});

//update Api - Patch /users
app.patch('/users/:userId', async (req, res) => {
    const userId = req.params?.userId;
    const data = req.body;
    try {

        const allowedUpdates = [
            "PhotoUrl",
            "firstName",
            "lastName",
            "skills",
            "age",
            "gender",
            "about",
            "password",
        ]

        const isUpdateAllowed = Object.keys(data).every((Key) =>
            allowedUpdates.includes(Key)
        );
        if (!isUpdateAllowed) {
            return res.status(400).send("Invalid update fields");
        }
        const user = await User.findByIdAndUpdate({ _id: userId }, data, {
            returnDocument: 'after',
            runValidators: true,
        });
        // console.log(user);
        res.send("User updated successfully");
    } catch (error) {
        res.status(400).send("Error updating user:" + error.message);
    }
});

// Connect to the database and start the server
connectDB()
    .then(() => {
        console.log('Database connected successfully');
        server.listen(process.env.PORT, () => {
            console.log('Server is running on port 3000');
        })
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });