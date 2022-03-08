const jwt = require("jsonwebtoken");
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const RefreshModel = require("../models/refresh-model");

class TokenService {
	generateToken(payload) {
		const accessToken = jwt.sign(payload, accessTokenSecret, {
			expiresIn: "1m" // 1 minute
		});

		const refreshToken = jwt.sign(payload, refreshTokenSecret, {
			expiresIn: "2d" // 2 days
		});

		return { accessToken, refreshToken };
	}

	async verifyAccessToken(token) {
		return jwt.verify(token, accessTokenSecret);
	}

	async verifyRefreshToken(token) {
		return jwt.verify(token, refreshTokenSecret);
	}

	async storeRefreshToken(token, userId) {
		try {
			await RefreshModel.create({
				token,
				user: userId
			});
		} catch (err) {
			console.log(err);
		}
	}

	async findRefreshToken(userId, refreshToken) {
		return await RefreshModel.findOne({
			user: userId,
			token: refreshToken
		});
	}

	async updateRefreshToken(userId, newToken) {
		return await RefreshModel.findOneAndUpdate(
			{ user: userId },
			{ token: newToken },
			{ new: true }
		);
	}

	async removeToken(refreshToken) {
		return await RefreshModel.findOneAndDelete({ token: refreshToken });
	}
}

module.exports = new TokenService();
