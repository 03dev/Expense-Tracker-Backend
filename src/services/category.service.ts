import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { CategoryRepository } from "../repositories/category.repository"

const createCategoryService = async (categoryName: string, userId: string, parentCategoryId?: string) => {
  if (parentCategoryId) {
    const parentCategory = await CategoryRepository.getCategoryById(parentCategoryId, userId);
    if (!parentCategory) {
      throw new NotFoundError("Parent category not found")
    }
  }
  return CategoryRepository.createCategory({ name: categoryName, userId, parentId: parentCategoryId });
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

const updateCategoryService = async (uuid: string, userId: string, name: string) => {
    const category = await CategoryRepository.getCategoryById(uuid,userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    return CategoryRepository.updateCategory(uuid, userId, name);
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