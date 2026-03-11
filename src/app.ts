import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan(env.NODE_ENV === "development" ? "dev": "combined"));

// Health check
app.get('/', (req: Request, res: Response) => {
    res.json({message: "Expense Tracker API is running"});
});

app.use("/auth", authRouter);

// Routes will come here later

// Error middleware - alays last
app.use(errorMiddleware);

export default app;