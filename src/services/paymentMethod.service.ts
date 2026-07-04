import { NotFoundError } from "../errors/NotFoundError";
import { paymentMethodRepository } from "../repositories/paymentMethod.repository";
import { CreatePaymentMethodInput, UpdatePaymentMehodInput } from "../validators/paymentMethod.validator";
import { logger } from "../utils/logger";

const createPaymentMethodService = async (userId: string, data: CreatePaymentMethodInput) => {
    const paymentMethod = await paymentMethodRepository.createPaymentMethod(userId, data);
    logger.info("Payment method created", { userId, paymentMethod});
    return paymentMethod;
};

const getPaymentMethodsService = async (userId: string) => {
    return paymentMethodRepository.getPaymentMethods(userId);
}

const getPaymentMethodByIdService = async (id: string, userId: string) => {
    const paymentMethod = await paymentMethodRepository.getPaymentMethodById(id, userId);
    if (!paymentMethod) throw new NotFoundError("Payment method not found");
    return paymentMethod;
}

const updatePaymentMethodService = async (id: string, userId: string, data: UpdatePaymentMehodInput) => {
    const paymentMethod = await paymentMethodRepository.getPaymentMethodById(id, userId);
    if (!paymentMethod) throw new NotFoundError("Payment method not found");
    return paymentMethodRepository.updatePaymentMethod(id, userId, data);
}

const deletePaymentMethodService = async (id: string, userId: string) => {
    const paymentMethod = await paymentMethodRepository.getPaymentMethodById(id, userId);
    if (!paymentMethod) throw new NotFoundError("Payment method not found");
    await paymentMethodRepository.deletePaymentMethod(id, userId);
    logger.info("Payment method deleted", { userId, id });
}

export const PaymentMethodService = {
    createPaymentMethodService,
    getPaymentMethodsService,
    getPaymentMethodByIdService,
    updatePaymentMethodService,
    deletePaymentMethodService
}