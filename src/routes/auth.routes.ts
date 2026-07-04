import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyResetOtpSchema,
  verifyTwoFactorSchema,
} from "../validators/auth.validator";
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
  asyncHandler(AuthController.signUpController),
);
router.post(
  "/verify-email",
  authRateLimit,
  validate({ body: verifyEmailSchema }),
  asyncHandler(AuthController.verifyEmailController),
);
router.post(
  "/verify-two-factor",
  authRateLimit,
  validate({ body: verifyTwoFactorSchema }),
  asyncHandler(AuthController.verifyTwoFactorController),
);
router.post(
  "/login",
  authRateLimit,
  validate({ body: loginSchema }),
  asyncHandler(AuthController.loginController),
);
router.post(
  "/resend-verification",
  authRateLimit,
  validate({ body: resendVerificationSchema }),
  asyncHandler(AuthController.resendVerificationCodeController),
);
router.patch(
  "/two-factor",
  authMiddleware,
  asyncHandler(AuthController.toggleTwoFactorController),
);
router.post(
  "/logout",
  tokenRateLimit,
  asyncHandler(AuthController.logoutController),
);
router.post(
  "/refresh",
  tokenRateLimit,
  asyncHandler(AuthController.refreshTokenController),
);
router.post(
  "/forgot-password",
  authRateLimit,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(AuthController.forgotPasswordController),
);
router.post(
  "/forgot-password/verify",
  authRateLimit,
  validate({ body: verifyResetOtpSchema }),
  asyncHandler(AuthController.verifyResetOtpController),
);
router.post(
  "/forgot-password/reset",
  authRateLimit,
  validate({ body: resetPasswordSchema }),
  asyncHandler(AuthController.resetPasswordController),
);

export default router;
