const sharp = require("sharp");
const path = require("path");
const UserDto = require("../dtos/user-dto");
const userService = require("../services/user-service");
const AppError = require("../utils/AppError");

class ActivateController {
	async activate(req, res, next) {
		const { name, avatar } = req.body;

		if (!name || !avatar) {
			const error = new AppError("all fields are required", 400);
			return next(error);
		}

		// store image (base64)
		const buffer = Buffer.from(
			avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
			"base64"
		);

		const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

		// compress image before storing
		try {
			await sharp(buffer)
				.resize(150)
				.toFile(path.resolve(__dirname, `../storage/${imagePath}`));
		} catch (err) {
			return next(err);
		}

		try {
			// update user
			const userId = req.user.id;
			const user = await userService.findUser({ _id: userId });
			if (!user) {
				throw new AppError("user not found", 404);
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
			next(err);
		}
	}
}

module.exports = new ActivateController();
