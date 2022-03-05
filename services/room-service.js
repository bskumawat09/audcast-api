const RoomModel = require("../models/room-model");

class RoomService {
	async create(data) {
		const { topic, roomType, ownerId } = data;

		const room = await RoomModel.create({
			topic,
			roomType,
			ownerId,
			speakers: [ownerId]
		});

		return room;
	}

	async findAllRooms(typesArr) {
		const rooms = await RoomModel.find({ roomType: { $in: typesArr } })
			.populate("speakers")
			.populate("ownerId")
			.exec();

		return rooms;
	}
}

module.exports = new RoomService();
