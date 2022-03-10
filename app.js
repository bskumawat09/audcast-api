require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ACTIONS = require("./actions");

const app = express();

const server = require("http").createServer(app);

// configure socket.io
const io = require("socket.io")(server, {
	cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] }
});

const dbConnect = require("./database");
const router = require("./routes");

app.use(cookieParser());
app.use(
	cors({
		origin: [process.env.CLIENT_URL],
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

// sockets
const socketUserMapping = {};

io.on("connection", (socket) => {
	console.log("new connection", socket.id);

	socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
		socketUserMapping[socket.id] = user;

		// get all the clients in a room with {roomId}
		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

		clients.forEach((clientId) => {
			// for every client in a room emit "add-peer" event (say to everyone "hey please add me in your connection")
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
		console.log("clients", clients);
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

	// handle mute/unmute
	socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

		clients.forEach((clientId) => {
			io.to(clientId).emit(ACTIONS.MUTE, {
				peerSocketId: socket.id,
				userId
			});
		});
	});

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
	const handleLeaveRoom = () => {
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
	};

	socket.on(ACTIONS.LEAVE, handleLeaveRoom);
	socket.on("disconnecting", handleLeaveRoom); // when browser is closed
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
