const sharp = require("sharp");
const path = require("path");
const UserDto = require("../dtos/user-dto");
const userService = require("../services/user-service");
const AppError = require("../utils/AppError");

class ActivateController {
	async activate(req, res, next) {
		try {
			const { name, avatar } = req.body;

			if (!name || !avatar) {
				throw new AppError("all fields are required", 400);
			}

			// store image (base64)
			const buffer = Buffer.from(
				avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
				"base64"
			);

			// const imageName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

			// compress image and store
			// await sharp(buffer)
			// 	.resize(150)
			// 	.toFile(path.resolve(__dirname, `../storage/${imageName}`));

			const imageBuffer = await sharp(buffer).resize(150).toBuffer();

			// update user
			const user = await userService.findUser({ _id: req.user.id });
			if (!user) {
				throw new AppError("user not found", 404);
			}

			// upload avatar to cloudinary
			const uploadRes = await userService.uploadAvatar(imageBuffer);
			if (!uploadRes) {
				throw new AppError("could not upload image", 500);
			}

			user.name = name;
			user.avatar = uploadRes.url;
			user.activated = true;
			await user.save();
			// user.avatar = `/storage/${imagePath}`;

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
