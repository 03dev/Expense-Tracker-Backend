import { NotFoundError } from "../errors/NotFoundError";
import { categoryRepository } from "../repositories/category.repository";
import { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";

const createCategoryService = async (userId: string, data: CreateCategoryInput) => {
  if (data.parentId) {
    const parentCategory = await categoryRepository.getCategoryById(data.parentId, userId);
    if (!parentCategory) throw new NotFoundError("Parent category not found");
  }

  // Restore soft-deleted category with the same name instead of creating a duplicate
  const deletedCategory = await categoryRepository.findDeletedCategoryByName(userId, data.name);
  if (deletedCategory) {
    return categoryRepository.restoreCategory(deletedCategory.id, userId, data);
  }

  return categoryRepository.createCategory(userId, data);
};

const getCategoriesService = async (userId: string) => {
  return categoryRepository.getCategories(userId);
};

const getCategoryByIdService = async (uuid: string, userId: string) => {
  const category = await categoryRepository.getCategoryById(uuid, userId);
  if (!category) throw new NotFoundError("Category not found");
  return category;
};

const updateCategoryService = async (uuid: string, userId: string, data: UpdateCategoryInput) => {
  const category = await categoryRepository.getCategoryById(uuid, userId);
  if (!category) throw new NotFoundError("Category not found");
  return categoryRepository.updateCategory(uuid, userId, data);
};

const deleteCategoryService = async (uuid: string, userId: string) => {
  const category = await categoryRepository.getCategoryById(uuid, userId);
  if (!category) throw new NotFoundError("Category not found");
  await categoryRepository.deleteCategory(uuid, userId);
};

export const CategoryService = {
  createCategoryService,
  getCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService,
};
