import { Router } from "express";
import { upload } from "../middlewares/upload.middleware";
import authMiddleware from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { UserController } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { changePasswordSchema, updateProfileSchema } from "../validators/user.validator";

const router = Router();

router.get("/profile", authMiddleware, asyncHandler(UserController.getProfile));

router.patch("/profile", authMiddleware, validate({body: updateProfileSchema}), asyncHandler(UserController.updateProfile));

router.patch("/password", authMiddleware, validate({body: changePasswordSchema}), asyncHandler(UserController.changePassword));

router.post("/avatar", authMiddleware, upload.single("avatar"), asyncHandler(UserController.uploadAvatar));

export default router;
