const express = require("express");
const router = express.Router();

const authController = require("./controllers/auth-controller");
const activateController = require("./controllers/activate-controller");
const authMiddleware = require("./middlewares/auth-middleware");
const roomController = require("./controllers/room-controller");

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/activate", authMiddleware, activateController.activate);
router.get("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.get("/rooms", authMiddleware, roomController.getRooms);
router.post("/rooms", authMiddleware, roomController.createRoom);
router.get("/rooms/:id", authMiddleware, roomController.getOneRoom);
router.put("/rooms/:id", authMiddleware, roomController.updateRoom);
router.delete("/rooms/:id", authMiddleware, roomController.deleteRoom);
router.get("/rooms/my-rooms", authMiddleware, roomController.getMyRooms);

module.exports = router;
