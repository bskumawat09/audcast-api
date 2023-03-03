const tokenService = require("../services/token-service");
const userService = require("../services/user-service");
const AppError = require("../utils/AppError");

module.exports = async (req, res, next) => {
    try {
        const { accessToken } = req.cookies;

        // if token not found in cookie
        if (!accessToken) {
            throw new AppError("token not found", 401);
        }
        // if token does not verify
        const userData = await tokenService.verifyAccessToken(accessToken);
        if (!userData) {
            throw new AppError("invalid token", 401);
        }
        // if the user associated with token no longer exist
        const user = await userService.findUser({ _id: userData.id });
        if (!user) {
            throw new AppError("user no longer exit", 401);
        }

        req.user = userData;
        next();
    } catch (err) {
        // for every error originated from here, send response code "401" so that client can invoke refresh route
        const error = new AppError(err.message, 401);
        next(error);
    }
};
