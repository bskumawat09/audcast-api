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
				hash: `${hash}.${expires}`,
				phone
			});
		} catch (err) {
			console.log("ERR", err);

			res.status(500).json({
				message: "could not send OTP"
			});
		}
	}

	async verifyOtp(req, res) {
		const { phone, otp, hash } = req.body;

		if (!phone || !otp || !hash) {
			return res.status(400).json({
				message: "all fields are required"
			});
		}

		// check the OTP
		const [hashedOtp, expires] = hash.split(".");

		if (Date.now() > +expires) {
			return res.status(400).json({
				message: "OTP expired"
			});
		}

		const data = `${phone}.${otp}.${expires}`;

		const isMatched = otpService.verifyOtp(hashedOtp, data);
		if (!isMatched) {
			return res.status(400).json({
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
			console.log("ERR", err);
			return res.status(500).json({
				message: "database error"
			});
		}

		// generate jwt tokens and set as cookie
		const { accessToken, refreshToken } = tokenService.generateToken({
			id: user._id,
			activated: user.activated
		});

		res.cookie("refreshToken", refreshToken, {
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			httpOnly: true
		});

		const userDto = new UserDto(user);

		res.json({
			user: userDto,
			accessToken,
			auth: true
		});
	}

	logout(req, res) {
		// delete token from cookies
		res.clearCookie("accessToken");

		res.json({
			user: null,
			auth: false
		});
	}
}

// singleton pattern
module.exports = new AuthController();
