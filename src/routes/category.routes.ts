import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategorySchema, categoryIdSchema, updateCategorySchema } from "../validators/category.validator";
import { CategoryController } from "../controllers/category.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/", authMiddleware, validate({body: createCategorySchema}), asyncHandler(CategoryController.createCategory));

router.get("/", authMiddleware, asyncHandler(CategoryController.getCategories));

router.get("/:id", authMiddleware, validate({params: categoryIdSchema}), asyncHandler(CategoryController.getCategoryById));

router.patch("/:id", authMiddleware, validate({params: categoryIdSchema, body: updateCategorySchema}), asyncHandler(CategoryController.updateCategory));

router.delete("/:id", authMiddleware, validate({params: categoryIdSchema}), asyncHandler(CategoryController.deleteCategory));

export default router