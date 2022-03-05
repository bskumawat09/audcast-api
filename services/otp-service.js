const crypto = require("crypto");
const hashService = require("./hash-service");

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require("twilio")(twilioAccountSid, twilioAuthToken, {
	lazyLoading: true
});

class OtpService {
	async generateOtp() {
		const otp = crypto.randomInt(10000, 99999);
		return otp;
	}

	async sendBySms(number, otp) {
		// send OTP using some 3rd party service (Twilio)
		const response = await twilio.messages.create({
			to: number,
			from: process.env.TWILIO_PHONE_NUMBER,
			body: `Your Audcast OTP is ${otp}`
		});

		console.log(`OTP (${otp}) sent to ${number}`);
		console.log(response.sid);
		return response;
	}

	verifyOtp(hashedOtp, data) {
		const computedHash = hashService.hashOtp(data);

		return computedHash === hashedOtp;
	}
}

module.exports = new OtpService();
