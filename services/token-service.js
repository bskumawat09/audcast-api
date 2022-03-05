const jwt = require("jsonwebtoken");
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const RefreshModel = require("../models/refresh-model");

class TokenService {
	generateToken(payload) {
		const accessToken = jwt.sign(payload, accessTokenSecret, {
			expiresIn: "1h"
		});

		const refreshToken = jwt.sign(payload, refreshTokenSecret, {
			expiresIn: "1y"
		});

		return { accessToken, refreshToken };
	}

	async verifyAccessToken(token) {
		return jwt.verify(token, accessTokenSecret);
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
}

module.exports = new TokenService();
