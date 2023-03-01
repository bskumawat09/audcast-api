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
                ownerId: req.user.id,
            });

            res.status(201).json({
                status: "success",
                room: new RoomDto(room),
            });
        } catch (err) {
            console.log("ROOM CONTROLLER | createRoom()--------------->", err);
            next(err);
        }
    }

    async getRooms(req, res, next) {
        try {
            const rooms = await roomService.findRooms({
                $or: [
                    { roomType: { $in: ["open"] } },
                    { ownerId: req.user.id },
                ],
            });

            const allRooms = rooms.map((room) => new RoomDto(room));

            res.json({
                status: "success",
                results: allRooms.length,
                rooms: allRooms,
            });
        } catch (err) {
            console.log("ROOM CONTROLLER | getRooms()--------------->", err);
            next(err);
        }
    }

    async getOneRoom(req, res, next) {
        try {
            const { id } = req.params;
            const room = await roomService.findOneRoom({ _id: id });

            if (!room) {
                throw new AppError("room not found", 404);
            }

            res.json({
                status: "success",
                room,
            });
        } catch (err) {
            console.log("ROOM CONTROLLER | getOneRoom()--------------->", err);
            next(err);
        }
    }

    async getMyRooms(req, res, next) {
        try {
            const rooms = await roomService.findRooms({ ownerId: req.user.id });

            res.json({
                status: "success",
                results: rooms.length,
                rooms,
            });
        } catch (err) {
            console.log("ROOM CONTROLLER | getMyRooms()--------------->", err);
            next(err);
        }
    }

    async updateRoom(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            let room = await roomService.findOneRoom({ _id: id });

            // check if current user owns this room
            if (!room.ownerId.equals(req.user.id)) {
                const error = new AppError(
                    "you are not authorized to perform this operation",
                    403
                );
                return next(error);
            }

            room = await roomService.updateRoom({ _id: id }, data);

            res.json({
                status: "success",
                room,
            });
        } catch (err) {
            console.log("ROOM CONTROLLER | updateRoom()--------------->", err);
            next(err);
        }
    }

    async deleteRoom(req, res, next) {
        try {
            const { id } = req.params;
            const room = await roomService.findOneRoom({ _id: id });

            if (!room) {
                throw new AppError("room not found", 404);
            }

            // check if current user owns this room
            if (!room.ownerId.equals(req.user.id)) {
                throw new AppError(
                    "you are not authorized to perform this operation",
                    403
                );
            }

            await roomService.deleteRoom({ _id: id });

            res.json({
                status: "success",
                room: room._id,
            });
        } catch (err) {
            console.log("ROOM CONTROLLER | deleteRoom()--------------->", err);
            next(err);
        }
    }
}

module.exports = new RoomController();
