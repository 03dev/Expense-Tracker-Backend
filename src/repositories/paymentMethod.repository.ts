import { prisma } from "../config/prisma";
import { BaseRepository } from "./baseRepository";
import { CreatePaymentMethodInput, UpdatePaymentMehodInput } from "../validators/paymentMethod.validator";

const paymentMethodSelect = {
    id: true,
    name: true,
    type: true,
    lastFourDigits: true,
    isDefault: true,
    createdAt: true,
} as const;

class PaymentMethodRepository extends BaseRepository<typeof prisma.paymentMethod> {
  constructor() {
    super(prisma.paymentMethod);
  }

  async createPaymentMethod(userId: string, data: CreatePaymentMethodInput) {
    if(data.isDefault) {
        await this.delegate.updateMany({
            where: { userId, deletedAt: null },
            data: {isDefault: false},
        });
    }

    return this.delegate.create({
        data: {...data, userId },
        select: paymentMethodSelect,
    })
  }

  async getPaymentMethods(userId: string) {
    return this.delegate.findMany({
        where: this.baseWhere(userId),
        select: paymentMethodSelect,
        orderBy: { createdAt: "asc" },
    });
  }

  async getPaymentMethodById(id: string, userId: string) {
    return this.delegate.findFirst({
        where: this.baseWhere(userId, { id }),
        select: paymentMethodSelect,
    });
  }

  async updatePaymentMethod(id: string, userId: string, data: UpdatePaymentMehodInput) {
    if(data.isDefault) {
        await this.delegate.updateMany({
            where: { userId, deletedAt: null },
            data: { isDefault: false }
        });
    }

    return this.delegate.update({
        where: { id_userId: { id, userId }},
        data,
        select: paymentMethodSelect
    });
  }

  async deletePaymentMethod(id: string, userId: string) {
    await this.softDelete(userId, id);
    return { id };
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();