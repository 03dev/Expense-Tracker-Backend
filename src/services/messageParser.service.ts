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
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: env.GROQ_API_KEY,
});

export const parseTransactionMessage = async (
  message: string
): Promise<ParsedTransaction> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const lowerMessage = message.toLowerCase();

    const transactionType =
      lowerMessage.includes("credited") || lowerMessage.includes("received")
        ? "INCOME"
        : "EXPENSE";

    const prompt = `
Convert this bank SMS into JSON.

SMS:
"${message}"

Return ONLY valid JSON, no explanation, no markdown:
{
  "amount": number,
  "type": "${transactionType}",
  "merchant": string | null,
  "date": "${today}",
  "suggestedCategory": string,
  "note": string
}

Rules:
- merchant should be company/shop/person name
- do not use account numbers as merchant
- keep note short

Categories:
Food & Dining, Groceries, Transport, Shopping, Entertainment, Health & Medical, Utilities, Salary, Travel, Subscriptions, Uncategorized
`;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You extract bank transaction data and return only compact JSON. No markdown, no explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    if (!response.choices?.length) {
      throw new Error("No choices returned from model");
    }

    let text = response.choices[0].message?.content ?? "";

    // Cleanup just in case
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found");
    }

    text = text.slice(firstBrace, lastBrace + 1);

    let parsed: ParsedTransaction;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("INVALID JSON:", text);
      throw new Error("Model returned invalid JSON");
    }

    // Force deterministic type
    parsed.type = transactionType;

    logger.info("Message parsed successfully", { parsed });

    return parsed;
  } catch (error) {
    logger.error("Failed to parse message", { error });
    throw new Error("Could not extract transaction details from message");
  }
};