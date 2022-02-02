require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const dbConnect = require("./database");
const router = require("./routes");

app.use(cors());
app.use(express.json());

dbConnect();

app.use(router);

app.get("/", (req, res) => {
	res.send("Welcome to voice chat api");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
