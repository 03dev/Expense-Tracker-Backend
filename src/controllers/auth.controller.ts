import { AuthServices } from "../services/auth.service";
import { env } from "../config/env";
import { AppRequest } from "../types/request.types";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { Request, Response } from "express";
import { success } from "zod";
import { UnauthorizedError } from "../errors/UnauthorizedError";

const signUpController = async (req: AppRequest, res: Response) => {
    const body = req.validated?.body as RegisterInput;
    const { accessToken, refreshToken } = await AuthServices.registerService(body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        accessToken
    });
}

const loginController = async (req: AppRequest, res: Response) => {
    const body = req.validated?.body as LoginInput;
    const { accessToken, refreshToken } = await AuthServices.loginService(body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
        success: true,
        message: "User login successfully",
        accessToken
    });
}

const logoutController = async (req: AppRequest, res: Response) => {
    const token = req.cookies?.refreshToken;

    if(!token) {
        throw new UnauthorizedError("No refresh token provided");
    }

    await AuthServices.logoutService(token);
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        path: "/auth/refresh",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        message: "Logout successfully"
    });
}

const refreshTokenController = async (req: AppRequest, res: Response) => {
    const token = req.cookies?.refreshToken;

    if(!token) {
        throw new UnauthorizedError("No refresh token provided");
    }

    const { accessToken, refreshToken } = await AuthServices.refreshTokenService(token);

    res.clearCookie("refreshToken", {path: "/auth/refresh"});
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
        accessToken
    });
}

export const AuthController = {
    signUpController,
    loginController,
    refreshTokenController,
    logoutController
}