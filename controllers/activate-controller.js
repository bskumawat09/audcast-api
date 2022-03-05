const Jimp = require("jimp");
const path = require("path");
const UserDto = require("../dtos/user-dto");
const userService = require("../services/user-service");

class ActivateController {
	async activate(req, res) {
		const { name, avatar } = req.body;

		if (!name || !avatar) {
			return res.status(400).json({
				status: "error",
				message: "all fields are required"
			});
		}

		// store image (base64)
		const buffer = Buffer.from(
			avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
			"base64"
		);

		const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

		// compress image before storing
		try {
			const jimpResponse = await Jimp.read(buffer);

			jimpResponse
				.resize(150, Jimp.AUTO)
				.write(path.resolve(__dirname, `../storage/${imagePath}`));
		} catch (err) {
			return res.status(500).json({
				status: "error",
				message: err.message
			});
		}

		// update user
		const userId = req.user.id;
		try {
			const user = await userService.findUser({ _id: userId });
			if (!user) {
				return res.status(404).json({
					status: "error",
					message: "user not found"
				});
			}

			user.name = name;
			user.avatar = `/storage/${imagePath}`;
			user.activated = true;
			await user.save();

			res.json({
				status: "success",
				user: new UserDto(user),
				auth: true
			});
		} catch (err) {
			res.status(500).json({
				status: "error",
				message: "something went wrong"
			});
		}
	}
}

module.exports = new ActivateController();
