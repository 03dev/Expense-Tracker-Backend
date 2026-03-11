import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator"
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post('/signup', validate({body: registerSchema}), AuthController.signUpController);
router.post('/login', validate({body: loginSchema}), AuthController.loginController);
router.post('/logout', AuthController.logoutController);
router.post('/refresh', AuthController.refreshTokenController);

export default router;