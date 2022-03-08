require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ACTIONS = require("./actions");

const app = express();

const server = require("http").createServer(app);

// configure socket.io
const io = require("socket.io")(server, {
	cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

const dbConnect = require("./database");
const router = require("./routes");

app.use(cookieParser());
app.use(
	cors({
		origin: ["http://localhost:3000"],
		credentials: true
	})
);
app.use(express.json({ limit: "8mb" }));
app.use("/storage", express.static("storage"));

dbConnect();

app.use(router);

app.get("/", (req, res) => {
	res.send("Welcome to voice chat api");
});

const socketUserMapping = {};

io.on("connection", (socket) => {
	console.log("new connection", socket.id);

	socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
		socketUserMapping[socket.id] = user;
		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

		clients.forEach((clientId) => {
			io.to(clientId).emit(ACTIONS.ADD_PEER, {});
		});

		socket.emit(ACTIONS.ADD_PEER, {});
		socket.join(roomId);
		console.log(clients);
	});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
