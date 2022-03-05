const roomService = require("../services/room-service");
const RoomDto = require("../dtos/room-dto");

class RoomController {
	async createRoom(req, res) {
		const { topic, roomType } = req.body;

		if (!topic || !roomType) {
			return res.status(400).json({
				message: "all fields are required"
			});
		}

		const room = await roomService.create({
			topic,
			roomType,
			ownerId: req.user.id
		});

		res.json({
			room: new RoomDto(room)
		});
	}

	async getRooms(req, res) {
		const rooms = await roomService.findAllRooms(["open"]);

		const allRooms = rooms.map((room) => new RoomDto(room));

		res.json({
			results: allRooms.length,
			rooms: allRooms
		});
	}
}

module.exports = new RoomController();
