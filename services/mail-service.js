const transporter = require("../config/nodemailer-config");

class MailService {
    async sendMail(mailOptions) {
        const info = await transporter.sendMail(mailOptions);
        console.log("Mail sent", info.response);
        return info;
    }

    createMailOptions(email, otp) {
        const body = `
		<div>Hello ${email}</div>
		<p>Your One Time Password(OTP) is <b>${otp}</b> valid for 10 minutes.</p>
		<div>Thank You,<br>Audcast Care Team</div>
		`;

        const mailOptions = {
            from: '"Audcast" <care@audcast.com>', // sender address
            to: email, // list of receivers
            subject: "OTP to activate your Audcast account",
            text: body,
            html: `<div>${body}</div>`,
        };
        return mailOptions;
    }
}

module.exports = new MailService();
