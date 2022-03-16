const UserModel = require("../models/user-model");
const cloudinary = require("../config/cloudinary-config");

class UserService {
	async findUser(filter) {
		const user = await UserModel.findOne(filter);
		return user;
	}

	async createUser(data) {
		const user = await UserModel.create(data);
		return user;
	}

	uploadAvatar(imageBuffer) {
		return new Promise((resolve, reject) => {
			if (imageBuffer) {
				cloudinary.uploader
					.upload_stream({ folder: "Avatars" }, (err, result) => {
						if (err) {
							console.log(err);
							reject(err);
						} else {
							console.log(`upload succeed: ${result.url}`);
							resolve(result);
						}
					})
					.end(imageBuffer);
			}
		});
	}
}

module.exports = new UserService();
