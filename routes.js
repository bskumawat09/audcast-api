const express = require("express");
const router = express.Router();

const authController = require("./controllers/auth-controller");
const activateController = require("./controllers/activate-controller");
const authMiddleware = require("./middlewares/auth-middleware");
const roomController = require("./controllers/room-controller");

/* AUTH ROUTES */
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/activate", authMiddleware, activateController.activate);
router.get("/refresh", authController.refresh);
router.post("/logout", authController.logout);

/* ROOMS ROUTES */
router
    .route("/rooms")
    .get(authMiddleware, roomController.getRooms)
    .post(authMiddleware, roomController.createRoom);

router.get("/rooms/my-rooms", authMiddleware, roomController.getMyRooms);

router
    .route("/rooms/:id")
    .get(authMiddleware, roomController.getOneRoom)
    .put(authMiddleware, roomController.updateRoom)
    .delete(authMiddleware, roomController.deleteRoom);

module.exports = router;
