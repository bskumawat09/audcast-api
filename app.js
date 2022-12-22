if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}
const express = require("express");
const Cors = require("cors");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/AppError");
const errorHandler = require("./controllers/error-controller");
const ACTIONS = require("./actions");

const app = express();

/* configure socket.io */
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
	cors: {
		origin: [process.env.CLIENT_URL, "http://localhost:3000"],
		methods: ["GET", "POST"]
	}
});

const dbConnect = require("./config/database-config");
dbConnect();

/* middlewares */
app.use(cookieParser());
app.use(
	Cors({
		credentials: true,
		origin: [process.env.CLIENT_URL, "http://localhost:3000"]
	})
);
app.use(express.json({ limit: "5mb" }));
app.use("/storage", express.static("storage")); // for serving static files from server

const router = require("./routes");
app.use("/api", router);

app.get("/api", (req, res) => {
	res.send("Welcome to Audcast REST API");
});

app.all("*", (req, res, next) => {
	const err = new AppError("resource not found", 404);
	next(err);
});

app.use(errorHandler); // custom error handler

/* sockets */
const socketUserMapping = {};

io.on("connection", (socket) => {
	socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
		socketUserMapping[socket.id] = user;

		// get all the clients in a room with {roomId}
		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

		clients.forEach((clientId) => {
			// emit "add-peer" event to every client in a room (say to everyone "hey please add me in your connection")
			io.to(clientId).emit(ACTIONS.ADD_PEER, {
				peerSocketId: socket.id,
				createOffer: false,
				user: user
			});

			socket.emit(ACTIONS.ADD_PEER, {
				peerSocketId: clientId,
				createOffer: true,
				user: socketUserMapping[clientId]
			});
		});

		socket.join(roomId);
	});

	// handle relay-ice
	socket.on(ACTIONS.RELAY_ICE, ({ peerSocketId, icecandidate }) => {
		io.to(peerSocketId).emit(ACTIONS.ICE_CANDIDATE, {
			peerSocketId: socket.id,
			icecandidate
		});
	});

	// handle relay-sdp (session description)
	socket.on(ACTIONS.RELAY_SDP, ({ peerSocketId, sessionDescription }) => {
		io.to(peerSocketId).emit(ACTIONS.SESSION_DESCRIPTION, {
			peerSocketId: socket.id,
			sessionDescription
		});
	});

	// handle mute
	socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

		clients.forEach((clientId) => {
			io.to(clientId).emit(ACTIONS.MUTE, {
				peerSocketId: socket.id,
				userId
			});
		});
	});

	// handle unmute
	socket.on(ACTIONS.UNMUTE, ({ roomId, userId }) => {
		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

		clients.forEach((clientId) => {
			io.to(clientId).emit(ACTIONS.UNMUTE, {
				peerSocketId: socket.id,
				userId
			});
		});
	});

	// handle leaving the room
	function handleLeaveRoom() {
		const { rooms } = socket;
		Array.from(rooms).forEach((roomId) => {
			const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

			clients.forEach((clientId) => {
				// say to everyone "hey please remove me from your connection"
				io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
					peerSocketId: socket.id,
					userId: socketUserMapping[socket.id]?.id
				});

				socket.emit(ACTIONS.REMOVE_PEER, {
					peerSocketId: clientId,
					userId: socketUserMapping[clientId]?.id
				});
			});

			socket.leave(roomId);
		});

		delete socketUserMapping[socket.id];
	}

	socket.on(ACTIONS.LEAVE, handleLeaveRoom);
	socket.on("disconnecting", handleLeaveRoom); // when the browser is closed
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Listening on http://localhost:${PORT}`);
});
