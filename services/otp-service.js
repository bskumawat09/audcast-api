const crypto = require("crypto");
const hashService = require("./hash-service");

class OtpService {
	async generateOtp() {
		const otp = crypto.randomInt(10000, 99999);
		return otp;
	}

	sendBySms(number, otp) {
		console.log(`OTP (${otp}) sent to ${number}`);
	}

	verifyOtp(hashedOtp, data) {
		const computedHash = hashService.hashOtp(data);

		return computedHash === hashedOtp;
	}
}

module.exports = new OtpService();
