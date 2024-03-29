const RoomModel = require("../models/room-model");

class RoomService {
    async create(data) {
        const { topic, roomType, ownerId } = data;

        const room = await RoomModel.create({
            topic,
            roomType,
            ownerId,
            speakers: [ownerId],
        });

        return room;
    }

    async findRooms(filter, page, limit) {
        // const rooms = await RoomModel.find(filter).populate("speakers").exec();
        const rooms = await RoomModel.find(filter)
            .skip(page * limit)
            .limit(limit)
            .populate("speakers")
            .exec();

        return rooms;
    }

    async countRooms(filter) {
        const total = await RoomModel.countDocuments(filter);
        return total;
    }

    async findOneRoom(filter) {
        const room = await RoomModel.findOne(filter).populate("speakers");
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
        return room._id;
    }
}

module.exports = new RoomService();
