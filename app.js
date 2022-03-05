require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const dbConnect = require("./database");
const router = require("./routes");

app.use(cookieParser());
app.use(
	cors({
		origin: ["http://localhost:3000"],
		credentials: true
	})
);
app.use(express.json());
app.use("/storage", express.static("storage"));

dbConnect();

app.use(router);

app.get("/", (req, res) => {
	res.send("Welcome to voice chat api");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
