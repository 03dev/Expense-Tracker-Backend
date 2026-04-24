import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { BudgetRepository } from "../repositories/budget.repository";
import { CategoryRepository } from "../repositories/category.repository";
import {
  CreateBudgetInput,
  GetBudgetsInput,
  UpdateBudgetInput,
} from "../validators/budget.validator";
const createBudgetService = async (userId: string, data: CreateBudgetInput) => {
  // 1. Check category exists
  const category = await CategoryRepository.getCategoryById(
    data.categoryId,
    userId,
  );
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  // 2. Check if active budget already exists → block it
  const existingBudget = await BudgetRepository.findExistingBudget(
    userId,
    data.categoryId,
    data.month,
    data.year,
  );

  if (existingBudget) {
    throw new BadRequestError("Budget already exists");
  }

  // 3. Check if soft deleted budget exists → restore it
  const deletedBudget = await BudgetRepository.findDeletedBudget(userId, data);
  
  if (deletedBudget) {
    return BudgetRepository.restoreBudget(deletedBudget.id, data);
  }

  // 4. Nothing exists → create fresh
  return BudgetRepository.createBudget(userId, data);
};

const getBudgetsService = async (userId: string, filter: GetBudgetsInput) => {
  return BudgetRepository.getBudgets(userId, filter);
};

const getBudgetByIdService = async (id: string, userId: string) => {
  const budget = await BudgetRepository.getBudgetById(id, userId);

  if (!budget) {
    throw new NotFoundError("Budget not found");
  }

  return budget;
};

const updateBudgetService = async (
  id: string,
  userId: string,
  data: UpdateBudgetInput,
) => {
  const budget = await BudgetRepository.getBudgetById(id, userId);

  if (!budget) {
    throw new NotFoundError("Budget not found");
  }

  const newBudget = await BudgetRepository.updateBudget(id, userId, data);

  return newBudget;
};

const deleteBudgetService = async (id: string, userId: string) => {
  const budget = await BudgetRepository.getBudgetById(id, userId);

  if (!budget) {
    throw new NotFoundError("Budget not found");
  }

  await BudgetRepository.deleteBudget(id, userId);
};

export const BudgetService = {
  createBudgetService,
  getBudgetsService,
  getBudgetByIdService,
  updateBudgetService,
  deleteBudgetService,
};
