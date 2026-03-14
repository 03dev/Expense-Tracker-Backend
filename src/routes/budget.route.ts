import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { budgetIdSchema, createBudgetSchema, getBudgetsSchema, updateBudgetSchema } from "../validators/budget.validator";
import { BudgetController } from "../controllers/budget.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/", authMiddleware, validate({body: createBudgetSchema}), asyncHandler(BudgetController.createBudget));

router.get("/", authMiddleware, validate({query: getBudgetsSchema}), asyncHandler(BudgetController.getBudgets));

router.get("/:id", authMiddleware, validate({params: budgetIdSchema}), asyncHandler(BudgetController.getBudgetById));

router.patch("/:id", authMiddleware, validate({params: budgetIdSchema, body: updateBudgetSchema}), asyncHandler(BudgetController.updateBudget));

router.delete("/:id", authMiddleware, validate({params: budgetIdSchema}), asyncHandler(BudgetController.deleteBudget));

export default router;