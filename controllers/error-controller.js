module.exports = (err, req, res, next) => {
	const { statusCode = 500 } = err;

	if (!err.message) {
		err.message = "something went wrong";
	}

	res.status(statusCode).json({
		status: "error",
		error: {
			code: statusCode,
			name: err.name,
			message: err.message
		}
	});
};
