import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator"
import { AuthController } from "../controllers/auth.controller";
import { authRateLimit, tokenRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post('/signup', authRateLimit, validate({body: registerSchema}), AuthController.signUpController);

router.post('/login', authRateLimit, validate({body: loginSchema}), AuthController.loginController);

router.post('/logout', tokenRateLimit, AuthController.logoutController);

router.post('/refresh', tokenRateLimit, AuthController.refreshTokenController);

export default router;