import OpenAI from "openai";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface ParsedTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  merchant: string | null;
  date: string;
  suggestedCategory: string;
  note: string;
}

const client = new OpenAI({
  baseURL: "http://192.168.29.50:1234/v1",
  apiKey: "lm-studio",
});

export const parseTransactionMessage = async (
  message: string
): Promise<ParsedTransaction> => {
  try {
    const prompt = `Extract transaction details from this message and return ONLY a JSON object. No explanation, no markdown, no thinking tags, just raw JSON.

Message: "${message}"

Return this exact structure:
{
  "amount": <number>,
  "type": <"INCOME" or "EXPENSE">,
  "merchant": <string or null>,
  "date": <"YYYY-MM-DD" format, use today if not mentioned>,
  "suggestedCategory": <one of: "Food & Dining", "Groceries", "Transport", "Shopping", "Entertainment", "Health & Medical", "Housing & Rent", "Utilities", "Education", "Travel", "Salary", "Freelance", "Investment", "Subscriptions", "Uncategorized">,
  "note": <original message summarized briefly>
}

Rules:
- amount must be a positive number
- type is EXPENSE if money is debited/spent, INCOME if credited/received
- date today is ${new Date().toISOString().split("T")[0]}
- return ONLY the JSON object, nothing else`;

    const response = await client.chat.completions.create({
      model: "qwen/qwen3.5-9b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    let text = response.choices[0].message.content ?? "";

    // Remove thinking tags if model includes them
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    text = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);
    logger.info("Message parsed successfully", { parsed });
    return parsed as ParsedTransaction;
  } catch (error) {
    logger.error("Failed to parse message", { error });
    console.error("LM STUDIO ERROR:", error);
    throw new Error("Could not extract transaction details from message");
  }
};