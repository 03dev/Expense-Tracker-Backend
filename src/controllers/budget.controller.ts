import { Response } from "express";
import { AuthenticatedRequest } from "../types/request.types";
import { getBody, getParams, getQuery } from "../utils/getValidated";
import { BudgetIdInput, CreateBudgetInput, GetBudgetsInput, UpdateBudgetInput } from "../validators/budget.validator";
import { BudgetService } from "../services/budget.service";
import { NotFoundError } from "../errors/NotFoundError";

const createBudget = async (req: AuthenticatedRequest, res: Response) => {
    const body = getBody<CreateBudgetInput>(req);
    const budget = await BudgetService.createBudgetService(req.user.id, body);

    return res.status(201).json({
        success: true,
        message: "Budget created successfully",
        data: budget
    });
}

const getBudgets = async (req: AuthenticatedRequest, res: Response) => {
  const query = getQuery<GetBudgetsInput>(req);
  const budgets = await BudgetService.getBudgetsService(req.user.id, query);
  return res.status(200).json({
    success: true,
    message: "Budgets fetched successfully",
    data: budgets
  });
}

const getBudgetById = async (req: AuthenticatedRequest, res: Response) => {
    const params = getParams<BudgetIdInput>(req);
    const budget = await BudgetService.getBudgetByIdService(params.id, req.user.id);

    return res.status(200).json({
        success: true,
        message: "Budget fetched successfully",
        data: budget
    });
}

const updateBudget = async (req: AuthenticatedRequest, res: Response) => {
    const body = getBody<UpdateBudgetInput>(req);
    const params = getParams<BudgetIdInput>(req);
    const budget = await BudgetService.updateBudgetService(params.id, req.user.id, body);

    return res.status(200).json({
        success: true,
        message: "Budget updated successfully",
        data: budget
    });
}

const deleteBudget = async (req: AuthenticatedRequest, res: Response) => {
    const params = getParams<BudgetIdInput>(req);
    await BudgetService.deleteBudgetService(params.id, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Budget deleted successfully"
  });
}

const getBudgetHistory = async (req: AuthenticatedRequest, res: Response) => {
  const history = await BudgetService.getBudgetHistoryService(req.user.id);
  return res.status(200).json({
    success: true,
    message: "Budget history fetched successfully",
    data: history,
  });
};

export const BudgetController = {
    createBudget,
    getBudgets,
    getBudgetById,
    updateBudget,
    deleteBudget,
    getBudgetHistory
}