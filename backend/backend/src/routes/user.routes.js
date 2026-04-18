import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    updateUserName,
    updateAvatar,
    updatePassword,
    deleteUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public Routes
router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);

// Secure Routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/update-username", verifyJWT, updateUserName);
router.patch("/avatar", verifyJWT, upload.single("avatar"), updateAvatar);
router.patch("/update-password", verifyJWT, updatePassword);
router.delete("/delete-account", verifyJWT, deleteUser);

export default router;
