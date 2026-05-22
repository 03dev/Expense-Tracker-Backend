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
  baseURL: env.LM_STUDIO_URL,
  apiKey: "lm-studio",
});

export const parseTransactionMessage = async (
  message: string
): Promise<ParsedTransaction> => {

  try {

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const prompt = `
Convert this bank SMS into JSON.

SMS:
"${message}"

Return ONLY valid JSON.

{
  "amount": number,
  "type": "INCOME" | "EXPENSE",
  "merchant": string | null,
  "date": "${today}",
  "suggestedCategory": string,
  "note": string
}

Use categories like:
Food & Dining,
Groceries,
Transport,
Shopping,
Entertainment,
Health & Medical,
Utilities,
Salary,
Travel,
Subscriptions,
Uncategorized
`;

    const response = await client.chat.completions.create({
      model: "google/gemma-3-1b",
      messages: [
        {
          role: "system",
          content:
            "You extract bank transaction data and return only compact JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 140,
      top_p: 0.1,
    });

    console.log(
      "RAW RESPONSE:",
      JSON.stringify(response, null, 2)
    );

    if (!response.choices?.length) {
      throw new Error("No choices returned from model");
    }

    const choice = response.choices[0];

    if (choice.finish_reason === "length") {
      throw new Error("Model output truncated");
    }

    let text =
      choice.message?.content ?? "";

    console.log("RAW MODEL TEXT:");
    console.log(text);

    text = text
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1
    ) {
      throw new Error("No JSON object found");
    }

    text = text.slice(
      firstBrace,
      lastBrace + 1
    );

    console.log("CLEANED JSON:");
    console.log(text);

    let parsed: ParsedTransaction;

    try {
      parsed = JSON.parse(text);
    } catch (err) {

      console.error(
        "INVALID JSON:",
        text
      );

      throw new Error(
        "Model returned invalid JSON"
      );
    }

    logger.info(
      "Message parsed successfully",
      { parsed }
    );

    return parsed;

  } catch (error) {

    logger.error(
      "Failed to parse message",
      { error }
    );

    console.error(
      "LM STUDIO ERROR:",
      error
    );

    throw new Error(
      "Could not extract transaction details from message"
    );
  }
};