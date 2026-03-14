import { Response } from "express";
import { AuthenticatedRequest } from "../types/request.types";
import { CategoryService } from "../services/category.service";
import { CreateCategoryInput, UpdateCategoryInput, CategoryIdInput } from "../validators/category.validator";
import { getBody, getParams } from "../utils/getValidated";

const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  const body = getBody<CreateCategoryInput>(req);
  const category = await CategoryService.createCategoryService(
    body.name,
    req.user.id,
    body.parentId
  );
  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
};

const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  const categories = await CategoryService.getCategoriesService(req.user.id);
  return res.status(200).json({
    success: true,
    data: categories,
  });
};

const getCategoryById = async (req: AuthenticatedRequest, res: Response) => {
  const param = getParams<CategoryIdInput>(req);
  const category = await CategoryService.getCategoryByIdService(
    param.id,
    req.user.id
  );
  return res.status(200).json({
    success: true,
    data: category,
  });
};

const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const param = getParams<CategoryIdInput>(req);
  const body = getBody<UpdateCategoryInput>(req);
  const category = await CategoryService.updateCategoryService(
    param.id,
    req.user.id,
    body.name!
  );
  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
};

const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  const param = getParams<CategoryIdInput>(req);
  await CategoryService.deleteCategoryService(param.id, req.user.id);
  return res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
};

export const CategoryController = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};