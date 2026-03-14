import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { BudgetRepository } from "../repositories/budget.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { CreateBudgetInput, GetBudgetsInput, UpdateBudgetInput } from "../validators/budget.validator";

const createBudgetService = async (userId: string, data: CreateBudgetInput) => {
    const category = await CategoryRepository.getCategoryById(data.categoryId, userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    const existingBudget = await BudgetRepository.findExistingBudget(userId, data.categoryId, data.month,data.year);

    if(existingBudget) {
        throw new BadRequestError("Budget already exits");
    }

    return BudgetRepository.createBudget(userId, data);
}

const getBudgetsService = async (userId: string, filter: GetBudgetsInput) => {
    return BudgetRepository.getBudgets(userId, filter);
}

const getBudgetByIdService = async (id: string, userId: string) => {
    const budget = await BudgetRepository.getBudgetById(id, userId);

    if(!budget) {
        throw new NotFoundError("Budget not found");
    }

    return budget;
}

const updateBudgetService = async (id: string, userId: string, data: UpdateBudgetInput) => {
    const budget = await BudgetRepository.getBudgetById(id, userId);

    if(!budget) {
        throw new NotFoundError("Budget not found");
    }

    const newBudget = await BudgetRepository.updateBudget(id, userId, data);

    return newBudget;
}

const deleteBudgetService = async (id: string, userId: string) => {
    const budget = await BudgetRepository.getBudgetById(id, userId);

    if(!budget) {
        throw new NotFoundError("Budget not found");
    }

    await BudgetRepository.deleteBudget(id, userId);
}

export const BudgetService = {
    createBudgetService,
    getBudgetsService,
    getBudgetByIdService,
    updateBudgetService,
    deleteBudgetService
}