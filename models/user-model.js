const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		phone: {
			type: String,
			minlength: 10,
			maxlength: 13,
			trim: true
		},
		email: {
			type: String,
			lowercase: true,
			trim: true
		},
		name: {
			type: String,
			required: false
		},
		avatar: {
			type: String,
			required: false
		},
		activated: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("User", userSchema, "users");
