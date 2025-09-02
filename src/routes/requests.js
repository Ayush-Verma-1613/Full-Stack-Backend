const express = require('express');
const requestsRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest")
const { userAuth } = require('../Middleware/auth');
const user = require("../models/user")

requestsRouter.post('/request/send/:status/:touserId', userAuth, async (req, res) => {
    try {

        const fromUserId = req.user._id;
        const toUserId = req.params.touserId;
        const status = req.params.status;

        const allowedStatus = ["ignored", "interested"];
        if(!allowedStatus.includes(status)){
            return res.status(400).json({message: "Invalid status type: "+status});
        }

        const toUser = await user.findById(toUserId);
        if(!toUser){
            return res.status(400).json({ message : "User not found"});
        }

        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                {
                fromUserId, toUserId
                },
                {
                    fromUserId : toUserId,
                    toUserId : fromUserId
                }
            ],
        });
        if(existingConnectionRequest){
            return res.
            status(400)
            .send({message: "Connection Request Already Exists!!"})
        }
        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        });

        const data = await connectionRequest.save();
        res.json({
            message:
            req.user.firstName + " is " + status + " in " + toUser.firstName,
            data,
        })
    } catch (err) {
        res.send("ERROR : " + err.message);
    }
});

requestsRouter.post('/request/review/:status/:requestId', userAuth, async (req, res) => {
        try{
            const loggedInUser = req.user;
            const { status, requestId } = req.params;

            const allowedStatus = ["accepted", "rejected"];
            if(!allowedStatus.includes(status)){
                res.status(404).json({message: "Status not allowed"});
            }

            const connectionRequest = await ConnectionRequest.findOne({
                _id: requestId,
                toUserId: loggedInUser._id,
                status: "interested",
            });

            if(!connectionRequest){
                return res.status(404).json({message : "Connection Request not found"});
            };

            connectionRequest.status = status;
            const data = await connectionRequest.save();

            res.json({message: "Connection request" + status, data})

        }catch(err){
            res.status(404).send("ERROR :"+err.message);
        }
});

module.exports = requestsRouter;