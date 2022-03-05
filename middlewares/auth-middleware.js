const tokenService = require("../services/token-service");
const userService = require("../services/user-service");

module.exports = async (req, res, next) => {
	try {
		const { accessToken } = req.cookies;
		// if token not found in cookie
		if (!accessToken) {
			throw new Error("token not found");
		}
		// if token does not verify
		const userData = await tokenService.verifyAccessToken(accessToken);
		if (!userData) {
			throw new Error("invalid token");
		}
		// if the user associated with token no longer exist
		const user = await userService.findUser({ _id: userData.id });
		if (!user) {
			throw new Error("user no longer exit");
		}

		req.user = userData;
		next();
	} catch (err) {
		res.status(401).json({
			message: err.message
		});
	}
};
