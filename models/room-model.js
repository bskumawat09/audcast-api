const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema(
    {
        topic: {
            type: String,
            required: [true, "{PATH} is required"],
            unique: true,
            maxlength: 125,
        },
        roomType: {
            type: String,
            enum: {
                values: ["open", "social", "private"],
                message: "{VALUE} is not supported",
            },
            default: "open",
            required: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "{PATH} is required"],
        },
        speakers: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
            required: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema, "rooms");
