const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");

class AuthController {
	async sendOtp(req, res) {
		const { phone } = req.body;

		if (!phone) {
			return res.status(400).json({
				status: "error",
				message: "phone field is required"
			});
		}

		const otp = await otpService.generateOtp();
		const validity = 5 * 60 * 1000; // 5 minutes
		const expires = Date.now() + validity; // curr_time + 5 minutes
		const data = `${phone}.${otp}.${expires}`;

		const hash = hashService.hashOtp(data);

		try {
			await otpService.sendBySms(phone, otp);

			res.json({
				status: "success",
				hash: `${hash}.${expires}`,
				phone
			});
		} catch (err) {
			res.status(400).json({
				status: "error",
				message: err.message
			});
		}
	}

	async verifyOtp(req, res) {
		const { phone, otp, hash } = req.body;

		if (!phone || !otp || !hash) {
			return res.status(400).json({
				status: "error",
				message: "all fields are required"
			});
		}

		// check the OTP
		const [hashedOtp, expires] = hash.split(".");

		if (Date.now() > +expires) {
			return res.status(400).json({
				status: "error",
				message: "OTP expired"
			});
		}

		const data = `${phone}.${otp}.${expires}`;

		const isMatched = otpService.verifyOtp(hashedOtp, data);
		if (!isMatched) {
			return res.status(400).json({
				status: "error",
				message: "invalid OTP"
			});
		}

		// login the user or register new user
		let user;

		try {
			user = await userService.findUser({ phone });
			if (!user) {
				user = await userService.createUser({ phone });
			}
		} catch (err) {
			return res.status(500).json({
				status: "error",
				message: err.message
			});
		}

		// generate jwt tokens and set as cookie
		const { accessToken, refreshToken } = tokenService.generateToken({
			id: user._id,
			activated: user.activated
		});

		// store refreshToken into the database for given user
		await tokenService.storeRefreshToken(refreshToken, user._id);

		res.cookie("refreshToken", refreshToken, {
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			httpOnly: true
		});

		res.cookie("accessToken", accessToken, {
			maxAge: 1 * 60 * 60 * 1000, // 1 hour
			httpOnly: true
		});

		const userDto = new UserDto(user);

		res.json({
			status: "success",
			user: userDto,
			auth: true
		});
	}

	async refresh(req, res) {
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
			return res.status(401).json({
				status: "error",
				message: err.message
			});
		}
		// check if token is in database
		try {
			const token = await tokenService.findRefreshToken(
				userData.id,
				refreshTokenFromCookie
			);
			if (!token) {
				return res.status(401).json({
					status: "error",
					message: "token not matched in database"
				});
			}
		} catch (err) {
			return res.status(500).json({
				status: "error",
				message: err.message
			});
		}
		// check if user is valid
		let user;
		try {
			user = await userService.findUser({ _id: userData.id });
			if (!user) {
				return res.status(404).json({
					status: "error",
					message: "user not found"
				});
			}
		} catch (err) {
			return res.status(500).json({
				status: "error",
				message: err.message
			});
		}
		// generate new tokens
		const { refreshToken, accessToken } = tokenService.generateToken({
			id: user._id
		});
		// store updated refresh token in database
		try {
			await tokenService.updateRefreshToken(userData.id, refreshToken);
		} catch (err) {
			return res.status(500).json({
				status: "error",
				message: err.message
			});
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
