const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: function (val) {
                    return /^(\+91)?[6-9][0-9]{9}$/.test(val);
                },
                message: (props) =>
                    `${props.value} is not a valid phone number!`,
            },
        },
        email: {
            type: String,
            maxlength: 125,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (val) {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
                        val
                    );
                },
                message: (props) => `${props.value} is not a valid email!`,
            },
        },
        name: {
            type: String,
            required: false,
        },
        avatar: {
            type: String,
            required: false,
        },
        activated: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema, "users");
