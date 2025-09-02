const express = require("express");
const userRouter = express.Router();
const { userAuth } = require('../Middleware/auth');
const User = require('../models/user')
const ConnectionRequest = require("../models/connectionRequest")
const USER_SAFE_DATA =  "firstName lastName photoUrl age gender about skills";

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try{
        const loggedInUser = req.user;

        const connectionRequest = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        }).populate("fromUserId", USER_SAFE_DATA);


        res.json({message : "Data fetched successfully",
            data: connectionRequest,
        })


    }catch(err){
        res.status(404).send("ERROR : " +err.message);
    }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try{

        const loggedInUser = req.user;

        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id, status: "accepted" },
                { fromUserId: loggedInUser._id, status: "accepted"},
            ],
        }).populate("fromUserId", USER_SAFE_DATA)
            .populate("toUserId", USER_SAFE_DATA);


        const data = connectionRequest.map((row) =>{
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()){
                return row.toUserId;
            }
            return row.fromUserId;
        });

        res.json({
            data
        });




    }catch(err){
        res.status(404).send("ERROR : " +err.message);
    }
});

userRouter.get("/user/feed", userAuth, async (req, res)=>{
    try{

        // user should see all the user cards except.
        // 0. his own card.
        // 1. his connections.
        // 2. ignored people.
        // 3. already sent the connection request.

        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit>50 ? 50 : limit;
        const skip = (page-1) * limit;

        //Find all connection request (sent + recieved)
        const connectionRequest = await ConnectionRequest.find({
            $or:
            [{ fromUserId: loggedInUser._id},{toUserId: loggedInUser._id}],
        }).select("fromUserId , toUserId");
       

        const hideUserFromFeed = new Set()
        connectionRequest.forEach((req) => {
            hideUserFromFeed.add(req.fromUserId.toString());
            hideUserFromFeed.add(req.toUserId.toString());
        });
     

        const users = await User.find({
           $and: [{ _id: { $nin: Array.from(hideUserFromFeed)}},//nin = no in thin array
            { _id: {$ne: loggedInUser._id}},//ne = not equals to
           ],
        }).select(USER_SAFE_DATA)
        .skip(skip)
        .limit(limit);
        res.send(users);
    }catch(err){
        res.status(404).send("ERROR : " + err.message);
    }
});
module.exports = userRouter;