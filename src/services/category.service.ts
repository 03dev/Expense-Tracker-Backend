import { NotFoundError } from "../errors/NotFoundError";
import { CategoryRepository } from "../repositories/category.repository"
import { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";

const createCategoryService = async (userId: string, data: CreateCategoryInput) => {
  if (data.parentId) {
    const parentCategory = await CategoryRepository.getCategoryById(data.parentId, userId);
    if (!parentCategory) {
      throw new NotFoundError("Parent category not found")
    }
  }
  return CategoryRepository.createCategory(userId, data);
}

const getCategoriesService = async (userId: string) => {
    return CategoryRepository.getCategories(userId);
}

const getCategoryByIdService = async (uuid: string, userId: string) => {
    const category = await CategoryRepository.getCategoryById(uuid, userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    return category;
}

const updateCategoryService = async (uuid: string, userId: string, data: UpdateCategoryInput) => {
    const category = await CategoryRepository.getCategoryById(uuid,userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    return CategoryRepository.updateCategory(uuid, userId, data);
}

const deleteCategoryService = async (uuid: string, userId: string) => {
    const category = await CategoryRepository.getCategoryById(uuid, userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    await CategoryRepository.deleteCategory(uuid, userId);
}

export const CategoryService = {
    createCategoryService,
    getCategoriesService,
    getCategoryByIdService,
    updateCategoryService,
    deleteCategoryService
}