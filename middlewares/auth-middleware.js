const tokenService = require("../services/token-service");

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

		req.user = userData;
		next();
	} catch (err) {
		res.status(401).json({
			message: err.message,
		});
	}
};
