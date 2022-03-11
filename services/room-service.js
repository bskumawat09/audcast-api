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

	async findRooms(filter) {
		const rooms = await RoomModel.find(filter)
			.populate("speakers")
			.populate("ownerId")
			.exec();

		return rooms;
	}

	async findOneRoom(filter) {
		const room = await RoomModel.findOne(filter);
		return room;
	}

	async updateRoom(filter, data) {
		const room = await RoomModel.findOneAndUpdate(
			filter,
			{ $set: data },
			{ new: true }
		);
		return room;
	}

	async deleteRoom(filter) {
		const room = await RoomModel.findOneAndDelete(filter);
		return room;
	}
}

module.exports = new RoomService();
