const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");
const AppError = require("../utils/AppError");

class AuthController {
	async sendOtp(req, res, next) {
		const { phone } = req.body;

		if (!phone) {
			const error = new AppError("phone field is required", 400);
			return next(error);
		}

		const otp = await otpService.generateOtp();
		const validity = 5 * 60 * 1000; // 5 minutes
		const expires = Date.now() + validity; // curr_time + 5 minutes
		const data = `${phone}.${otp}.${expires}`;

		const hash = hashService.hashOtp(data);

		try {
			// TODO: uncomment inorder to send SMS
			// await otpService.sendBySms(phone, otp);

			res.json({
				status: "success",
				hash: `${hash}.${expires}`,
				phone,
				otp // TODO: remove "otp" property
			});
		} catch (err) {
			next(err);
		}
	}

	async verifyOtp(req, res, next) {
		const { phone, otp, hash } = req.body;

		if (!phone || !otp || !hash) {
			const error = new AppError("all fields are required", 400);
			return next(error);
		}

		// check the OTP
		const [hashedOtp, expires] = hash.split(".");

		if (Date.now() > +expires) {
			const error = new AppError("OTP has expired", 400);
			return next(error);
		}

		const data = `${phone}.${otp}.${expires}`;

		const isMatched = otpService.verifyOtp(hashedOtp, data);
		if (!isMatched) {
			const error = new AppError("invalid OTP", 400);
			return next(error);
		}

		// login the user or register new user
		let user;

		try {
			user = await userService.findUser({ phone });
			if (!user) {
				user = await userService.createUser({ phone });
			}
		} catch (err) {
			return next(err);
		}

		// generate jwt tokens and set as cookie
		const { accessToken, refreshToken } = tokenService.generateTokens({
			id: user._id,
			activated: user.activated
		});

		// store refreshToken into the database for given user
		await tokenService.storeRefreshToken(refreshToken, user._id);

		res.cookie("refreshToken", refreshToken, {
			maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
			httpOnly: true
		});

		res.cookie("accessToken", accessToken, {
			maxAge: 60 * 60 * 1000, // 1 hour
			httpOnly: true
		});

		const userDto = new UserDto(user);

		res.json({
			status: "success",
			user: userDto,
			auth: true
		});
	}

	async refresh(req, res, next) {
		// get refresh token from cookie
		const { refreshToken: refreshTokenFromCookie } = req.cookies;
		// check if token is valid
		let userData;
		try {
			const decoded = await tokenService.verifyRefreshToken(
				refreshTokenFromCookie
			);
			userData = decoded;
		} catch (err) {
			return next(err);
		}
		// check if token is in database
		try {
			const token = await tokenService.findRefreshToken(
				userData.id,
				refreshTokenFromCookie
			);
			if (!token) {
				const error = new AppError("token not matched in database", 404);
				return next(error);
			}
		} catch (err) {
			next(err);
		}
		// check if user is valid
		let user;
		try {
			user = await userService.findUser({ _id: userData.id });
			if (!user) {
				const error = new AppError("user not found", 404);
				return next(error);
			}
		} catch (err) {
			return next(err);
		}

		// generate new tokens
		const { refreshToken, accessToken } = tokenService.generateTokens({
			id: user._id
		});

		// store updated refresh token in database
		try {
			await tokenService.updateRefreshToken(userData.id, refreshToken);
		} catch (err) {
			return next(err);
		}

		// send them as cookie
		res.cookie("refreshToken", refreshToken, {
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			httpOnly: true
		});

		res.cookie("accessToken", accessToken, {
			maxAge: 1 * 60 * 60 * 1000, // 1 hour
			httpOnly: true
		});

		// send response
		const userDto = new UserDto(user);

		res.json({
			status: "success",
			user: userDto,
			auth: true
		});
	}

	async logout(req, res) {
		const { refreshToken } = req.cookies;

		// delete refresh token from database
		await tokenService.removeToken(refreshToken);

		// delete tokens from cookies
		res.clearCookie("refreshToken");
		res.clearCookie("accessToken");

		res.json({
			status: "success",
			user: null,
			auth: false
		});
	}
}

// singleton pattern
module.exports = new AuthController();
