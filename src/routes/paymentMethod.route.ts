import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createPaymentMethodSchema, updatePaymentMethodSchema, paymentMethodIdSchema } from "../validators/paymentMethod.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { PaymentMethodController } from "../controllers/paymentMethod.controller";

const router = Router();

router.post("/", authMiddleware, validate({ body: createPaymentMethodSchema }), asyncHandler(PaymentMethodController.createPaymentMethod));
router.get("/", authMiddleware, asyncHandler(PaymentMethodController.getPaymentMethods));
router.get("/:id", authMiddleware, validate({ params: paymentMethodIdSchema }), asyncHandler(PaymentMethodController.getPaymentMethodById));
router.patch("/:id", authMiddleware, validate({ params: paymentMethodIdSchema, body: updatePaymentMethodSchema }), asyncHandler(PaymentMethodController.updatePaymentMethod));
router.delete("/:id", authMiddleware, validate({ params: paymentMethodIdSchema }), asyncHandler(PaymentMethodController.deletePaymentMethod));

export default router;
