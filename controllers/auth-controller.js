const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");
const AppError = require("../utils/AppError");
const { AppConfig } = require("../config/app-config");

const refreshCookieOptions = {
    maxAge: AppConfig.REFRESH_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "none",
    secure: true,
};

const accessCookieOptions = {
    maxAge: AppConfig.ACCESS_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "none",
    secure: true,
};

class AuthController {
    async sendOtp(req, res, next) {
        try {
            const { phone, email } = req.body;

            if (!phone && !email) {
                throw new AppError("phone or email field is required", 400);
            }

            // const otp = await otpService.generateOtp();
            const otp = 12345; // TODO: remove this hardcoded OTP in production
            const validity = AppConfig.OTP_VALID_TILL; // 10 minutes
            const expires = Date.now() + validity; // curr_time + 10 minutes

            if (phone) {
                const data = `${phone}.${otp}.${expires}`;
                const hash = hashService.hashOtp(data);

                // await otpService.sendBySms(phone, otp); //TODO: enable actual sending sms

                res.json({
                    status: "success",
                    hash: `${hash}.${expires}`,
                    phone,
                });
            } else if (email) {
                const data = `${email}.${otp}.${expires}`;
                const hash = hashService.hashOtp(data);

                // await otpService.sendByMail(email, otp); //TODO: enable actual sending email

                res.json({
                    status: "success",
                    hash: `${hash}.${expires}`,
                    email,
                });
            }
        } catch (err) {
            console.log("AUTH CONTROLLER | sendOtp()--------------->", err);
            next(err);
        }
    }

    async verifyOtp(req, res, next) {
        try {
            const { phone, otp, hash, email } = req.body;
            if ((!phone && !email) || !otp || !hash) {
                throw new AppError("all fields are required", 400);
            }

            // check the OTP
            const [hashedOtp, expires] = hash.split(".");

            let data;
            if (phone) {
                data = `${phone}.${otp}.${expires}`;
            } else if (email) {
                data = `${email}.${otp}.${expires}`;
            }

            const isMatched = otpService.verifyOtp(hashedOtp, data);
            if (!isMatched) {
                throw new AppError("invalid OTP", 400);
            }

            // if matched but expired
            if (Date.now() > +expires) {
                throw new AppError("OTP has expired", 400);
            }

            // after successfully verifying OTP, login the user or register new user
            let user;
            if (phone) {
                user = await userService.findUser({ phone });
                if (!user) {
                    user = await userService.createUser({ phone });
                }
            } else if (email) {
                user = await userService.findUser({ email });
                if (!user) {
                    user = await userService.createUser({ email });
                }
            }

            // generate jwt tokens and set them as cookie
            const { accessToken, refreshToken } = tokenService.generateTokens({
                id: user._id,
                activated: user.activated,
            });

            // store refreshToken into the database for given user
            await tokenService.storeRefreshToken(refreshToken, user._id);

            res.cookie("refreshToken", refreshToken, refreshCookieOptions);
            res.cookie("accessToken", accessToken, accessCookieOptions);

            res.json({
                status: "success",
                user: new UserDto(user),
                auth: true,
            });
        } catch (err) {
            console.log("AUTH CONTROLLER | verifyOtp()--------------->", err);
            next(err);
        }
    }

    async refresh(req, res, next) {
        try {
            // get refresh token from cookie
            const { refreshToken: refreshTokenFromCookie } = req.cookies;
            if (!refreshTokenFromCookie) {
                throw new AppError("refresh token is missing", 400);
            }

            // check if token is valid
            let userData;
            const decoded = await tokenService.verifyRefreshToken(
                refreshTokenFromCookie
            );
            userData = decoded;

            // check if token is present in database
            let filter = { user: userData.id, token: refreshTokenFromCookie };
            const token = await tokenService.findRefreshToken(filter);
            if (!token) {
                throw new AppError("token not matched in database", 404);
            }

            // check if user is valid
            const user = await userService.findUser({ _id: userData.id });
            if (!user) {
                throw new AppError("user not found", 404);
            }

            // generate new tokens
            const { refreshToken, accessToken } = tokenService.generateTokens({
                id: user._id,
            });

            // store updated refresh-token in database
            await tokenService.updateRefreshToken(filter, refreshToken);

            // set them as cookie
            res.cookie("refreshToken", refreshToken, refreshCookieOptions);
            res.cookie("accessToken", accessToken, accessCookieOptions);

            res.json({
                status: "success",
                user: new UserDto(user),
                auth: true,
            });
        } catch (err) {
            console.log("AUTH CONTROLLER | refresh()--------------->", err);
            if (err.name === "JsonWebTokenError") err.statusCode = 400;
            next(err);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            // delete refresh token from database
            await tokenService.removeToken(refreshToken);

            // delete tokens from cookies
            res.clearCookie("refreshToken");
            res.clearCookie("accessToken");

            res.json({
                status: "success",
                user: null,
                auth: false,
            });
        } catch (err) {
            console.log("AUTH CONTROLLER | logout()--------------->", err);
            next(err);
        }
    }
}

module.exports = new AuthController();
