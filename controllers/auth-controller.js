const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");
const AppError = require("../utils/AppError");

class AuthController {
	async sendOtp(req, res, next) {
		try {
			const { phone, email } = req.body;

			if (!phone && !email) {
				throw new AppError("phone or email field is required", 400);
			}

			// const otp = await otpService.generateOtp();
			const otp = 97979; // TODO: remove it in production
			const validity = 10 * 60 * 1000; // 10 minutes
			const expires = Date.now() + validity; // curr_time + 10 minutes

			if (phone) {
				const data = `${phone}.${otp}.${expires}`;
				const hash = hashService.hashOtp(data);

				// await otpService.sendBySms(phone, otp);

				res.json({
					status: "success",
					hash: `${hash}.${expires}`,
					phone
				});
			} else if (email) {
				const data = `${email}.${otp}.${expires}`;
				const hash = hashService.hashOtp(data);

				// await otpService.sendByMail(email, otp);

				res.json({
					status: "success",
					hash: `${hash}.${expires}`,
					email
				});
			}
		} catch (err) {
			console.log(err);
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

			if (Date.now() > +expires) {
				throw new AppError("OTP has expired", 400);
			}

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

			// login the user or register new user
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

			// generate jwt tokens and set as cookie
			const { accessToken, refreshToken } = tokenService.generateTokens({
				id: user._id,
				activated: user.activated
			});

			// store refreshToken into the database for given user
			await tokenService.storeRefreshToken(refreshToken, user._id);

			res.cookie("refreshToken", refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				httpOnly: true,
				sameSite: "none",
				secure: true
			});

			res.cookie("accessToken", accessToken, {
				maxAge: 15 * 60 * 1000, // 15 minutes
				httpOnly: true,
				sameSite: "none",
				secure: true
			});

			res.json({
				status: "success",
				user: new UserDto(user),
				auth: true
			});
		} catch (err) {
			next(err);
		}
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
			httpOnly: true,
			sameSite: "none",
			secure: true
		});

		res.cookie("accessToken", accessToken, {
			maxAge: 15 * 60 * 1000, // 15 minutes
			httpOnly: true,
			sameSite: "none",
			secure: true
		});

		res.json({
			status: "success",
			user: new UserDto(user),
			auth: true
		});
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
				auth: false
			});
		} catch (err) {
			next(err);
		}
	}
}

// singleton pattern
module.exports = new AuthController();
