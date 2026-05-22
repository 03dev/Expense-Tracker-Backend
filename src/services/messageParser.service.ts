import OpenAI from "openai";
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
  baseURL: "https://feminize-posted-life.ngrok-free.dev/v1",
  apiKey: "lm-studio",
});

export const parseTransactionMessage = async (
  message: string
): Promise<ParsedTransaction> => {

  try {

    const today = new Date().toISOString().split("T")[0];

    const prompt = `
Extract transaction data from this SMS.

Return ONLY valid JSON.

SMS:
"${message}"

Format:
{
  "amount": number,
  "type": "INCOME" | "EXPENSE",
  "merchant": string | null,
  "date": "${today}",
  "suggestedCategory": string,
  "note": string
}
`;

    const response = await client.chat.completions.create({
      model: "gemma-3-1b-it",
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
      max_tokens: 80,
    });

    console.log(
      "RAW RESPONSE:",
      JSON.stringify(response, null, 2)
    );

    if (!response.choices?.length) {
      throw new Error("No choices returned from model");
    }

    let text =
      response.choices[0]?.message?.content ?? "";

    text = text
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found");
    }

    text = text.slice(firstBrace, lastBrace + 1);

    console.log("CLEANED JSON:", text);

    const parsed = JSON.parse(text);

    logger.info("Message parsed successfully", {
      parsed,
    });

    return parsed as ParsedTransaction;

  } catch (error) {

    logger.error("Failed to parse message", {
      error,
    });

    console.error("LM STUDIO ERROR:", error);

    throw new Error(
      "Could not extract transaction details from message"
    );
  }
};