import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import categoryRouter from "./routes/category.routes";
import transactionRouter from "./routes/transaction.routes";
import budgetRouter from "./routes/budget.route";
import notificationRouter from "./routes/notification.routes";
import analyticsRouter from "./routes/analytics.routes";
import userRouter from "./routes/user.routes";
import dashboardRouter from "./routes/dashboard.routes";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // This automatically allows the origin of the requester
  credentials: true
}));
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// Health check
app.get('/', (req: Request, res: Response) => {
    res.json({message: "Expense Tracker API is running"});
});

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    return originalJson(JSON.parse(JSON.stringify(data, (_, value) =>
      value?.constructor?.name === 'Decimal' ? Number(value) : value
    )));
  };
  next();
});

app.use("/auth", authRouter);
app.use("/categories", categoryRouter);
app.use("/transactions", transactionRouter);
app.use("/budgets", budgetRouter)
app.use("/notification", notificationRouter);
app.use("/analytics", analyticsRouter);
app.use("/user", userRouter);
app.use("/dashboard", dashboardRouter);

// Routes will come here later

// Error middleware - alays last
app.use(errorMiddleware);

export default app;