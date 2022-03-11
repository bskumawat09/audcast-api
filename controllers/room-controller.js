const roomService = require("../services/room-service");
const RoomDto = require("../dtos/room-dto");
const AppError = require("../utils/AppError");

class RoomController {
	async createRoom(req, res, next) {
		const { topic, roomType } = req.body;

		if (!topic || !roomType) {
			const error = new AppError("all fields are required", 400);
			return next(error);
		}

		try {
			const room = await roomService.create({
				topic,
				roomType,
				ownerId: req.user.id
			});

			res.json({
				status: "success",
				room: new RoomDto(room)
			});
		} catch (err) {
			next(err);
		}
	}

	async getRooms(req, res, next) {
		try {
			const rooms = await roomService.findAllRooms(["open"]);

			const allRooms = rooms.map((room) => new RoomDto(room));

			res.json({
				status: "success",
				results: allRooms.length,
				rooms: allRooms
			});
		} catch (err) {
			next(err);
		}
	}

	async getRoom(req, res, next) {
		try {
			const { id } = req.params;
			const room = await roomService.findOneRoom({ _id: id });

			res.json({
				status: "success",
				room
			});
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new RoomController();
