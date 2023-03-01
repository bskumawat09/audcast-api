const jwt = require("jsonwebtoken");
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const RefreshModel = require("../models/refresh-model");

class TokenService {
    generateTokens(payload) {
        const accessToken = jwt.sign(payload, accessTokenSecret, {
            expiresIn: "30m", // 30 minutes
        });

        const refreshToken = jwt.sign(payload, refreshTokenSecret, {
            expiresIn: "30d", // 30 days
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
        await RefreshModel.create({
            token,
            user: userId,
        });
    }

    async findRefreshToken(filter) {
        return await RefreshModel.findOne(filter);
    }

    async updateRefreshToken(filter, newToken) {
        return await RefreshModel.findOneAndUpdate(
            filter,
            { token: newToken },
            { new: true }
        );
    }

    async removeToken(refreshToken) {
        return await RefreshModel.findOneAndDelete({ token: refreshToken });
    }
}

module.exports = new TokenService();
