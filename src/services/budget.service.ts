import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { budgetRepository } from "../repositories/budget.repository";
import { categoryRepository } from "../repositories/category.repository";
import {
  CreateBudgetInput,
  GetBudgetsInput,
  UpdateBudgetInput,
} from "../validators/budget.validator";

const createBudgetService = async (userId: string, data: CreateBudgetInput) => {
  const category = await categoryRepository.getCategoryById(data.categoryId, userId);
  if (!category) throw new NotFoundError("Category not found");

  const existingBudget = await budgetRepository.findExistingBudget(
    userId,
    data.categoryId,
    data.month,
    data.year,
  );
  if (existingBudget) throw new BadRequestError("Budget already exists for this category and month");

  // Restore soft-deleted budget instead of creating a duplicate
  const deletedBudget = await budgetRepository.findDeletedBudget(userId, data);
  if (deletedBudget) {
    return budgetRepository.restoreBudget(deletedBudget.id, userId, data);
  }

  return budgetRepository.createBudget(userId, data);
};

const getBudgetsService = async (userId: string, filter: GetBudgetsInput) => {
  return budgetRepository.getBudgets(userId, filter);
};

const getBudgetByIdService = async (id: string, userId: string) => {
  const budget = await budgetRepository.getBudgetById(id, userId);
  if (!budget) throw new NotFoundError("Budget not found");
  return budget;
};

const updateBudgetService = async (id: string, userId: string, data: UpdateBudgetInput) => {
  const budget = await budgetRepository.getBudgetById(id, userId);
  if (!budget) throw new NotFoundError("Budget not found");
  return budgetRepository.updateBudget(id, userId, data);
};

const deleteBudgetService = async (id: string, userId: string) => {
  const budget = await budgetRepository.getBudgetById(id, userId);
  if (!budget) throw new NotFoundError("Budget not found");
  await budgetRepository.deleteBudget(id, userId);
};

const getBudgetHistoryService = async (userId: string) => {
  return budgetRepository.getBudgetHistory(userId);
};

export const BudgetService = {
  createBudgetService,
  getBudgetsService,
  getBudgetByIdService,
  updateBudgetService,
  deleteBudgetService,
  getBudgetHistoryService
};
