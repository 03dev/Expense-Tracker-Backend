import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { AuthController } from "../controllers/auth.controller";
import {
  authRateLimit,
  tokenRateLimit,
} from "../middlewares/rateLimit.middleware";
import authMiddleware from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/signup",
  authRateLimit,
  validate({ body: registerSchema }),
  AuthController.signUpController,
);
router.post(
  "/verify-email",
  authRateLimit,
  AuthController.verifyEmailController,
);
router.post(
  "/verify-two-factor",
  authRateLimit,
  AuthController.verifyTwoFactorController,
);
router.post(
  "/login",
  authRateLimit,
  validate({ body: loginSchema }),
  AuthController.loginController,
);
router.post('/resend-verification', authRateLimit, AuthController.resendVerificationCodeController);
router.patch("/two-factor", authMiddleware, asyncHandler(AuthController.toggleTwoFactorController));
router.post("/logout", tokenRateLimit, AuthController.logoutController);
router.post("/refresh", tokenRateLimit, AuthController.refreshTokenController);

export default router;
