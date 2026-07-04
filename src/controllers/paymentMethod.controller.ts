import { Response } from "express";
import { AuthenticatedRequest } from "../types/request.types";
import { getBody, getParams } from "../utils/getValidated";
import { CreatePaymentMethodInput, PaymentMethodInput, UpdatePaymentMehodInput } from "../validators/paymentMethod.validator";
import { PaymentMethodService } from "../services/paymentMethod.service";

const createPaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
    const body = getBody<CreatePaymentMethodInput>(req);
    const paymentMethod = await PaymentMethodService.createPaymentMethodService(req.user.id, body);
    return res.status(201).json({
        success: true,
        message: "Payment method created successfully",
        data: paymentMethod,
    });
};

const getPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
    const paymentMethod = await PaymentMethodService.getPaymentMethodsService(req.user.id);
    return res.status(200).json({
        success: true,
        message: "Payment method fetched successfully",
        data: paymentMethod,
    });
};

const getPaymentMethodById = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = getParams<PaymentMethodInput>(req);
    const paymentMethod = await PaymentMethodService.getPaymentMethodByIdService(id, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Payment method fetched successfully",
        data: paymentMethod,
    });
};

const updatePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = getParams<PaymentMethodInput>(req);
    const body = getBody<UpdatePaymentMehodInput>(req);
    const paymentMethod = await PaymentMethodService.updatePaymentMethodService(id, req.user.id, body);
    return res.status(200).json({
        success: true,
        message: "Payment method update successfully",
        data: paymentMethod,
    });
};

const deletePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = getParams<PaymentMethodInput>(req);
    await PaymentMethodService.deletePaymentMethodService(id, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Payment method deleted successfully",
    });
};

export const PaymentMethodController = {
    createPaymentMethod,
    getPaymentMethods,
    getPaymentMethodById,
    updatePaymentMethod,
    deletePaymentMethod
};