const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
    {
        fromUserId : {
            type : mongoose.Schema.Types.ObjectId,
            ref: "User", //reference to the user collection.
            required : true,

        },
        toUserId: {
            type : mongoose.Schema.Types.ObjectId,
            ref: "User",
            required : true,
                },
        status: {
            type: String,
            reuired: true,
            enum: {
                values: ["ignored", "interested", "accepted", "rejected"],
                message: `{VALUE} is incorrect status type`,
            }
        }
    },
    { timeStamp: true}
);

connectionRequestSchema.pre("save",function (next) {
    const connectionRequest = this;

    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        throw new Error("Cannot send connection request to yourself");
    }

    next();
});

const ConnectionRequiestModel = new mongoose.model(
    "ConnectionRequest",
    connectionRequestSchema
)

module.exports = ConnectionRequiestModel;