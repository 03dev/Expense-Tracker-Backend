import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export const matchCategory = async (
  userId: string,
  suggestedCategory: string
): Promise<string> => {
  // Priority 1 — user's own category (exact match)
  const userCategory = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: suggestedCategory, mode: "insensitive" },
      deletedAt: null,
    },
  });

  if (userCategory) {
    logger.info("Matched user category", { name: userCategory.name });
    return userCategory.id;
  }

  // Priority 2 — system category (exact match)
  const systemCategory = await prisma.category.findFirst({
    where: {
      userId: null,
      name: { equals: suggestedCategory, mode: "insensitive" },
    },
  });

  if (systemCategory) {
    logger.info("Matched system category", { name: systemCategory.name });
    return systemCategory.id;
  }

  // Priority 3 — fall back to Uncategorized
  const uncategorized = await prisma.category.findFirst({
    where: {
      userId: null,
      name: "Uncategorized",
    },
  });

  if (!uncategorized) {
    throw new Error("Uncategorized system category not found. Run seed first.");
  }

  logger.info("No match found, using Uncategorized");
  return uncategorized.id;
};