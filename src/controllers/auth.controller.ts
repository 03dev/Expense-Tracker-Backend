import { AuthServices } from "../services/auth.service";
import { env } from "../config/env";
import { AppRequest } from "../types/request.types";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { Response } from "express";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { getBody } from "../utils/getValidated";

const signUpController = async (req: AppRequest, res: Response) => {
    const body = getBody<RegisterInput>(req);
    const { user, accessToken, refreshToken } = await AuthServices.registerService(body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
        success: true,
        user,
        message: "User registered successfully",
        accessToken
    });
}

const loginController = async (req: AppRequest, res: Response) => {
    const body = getBody<LoginInput>(req);
    const { user, accessToken, refreshToken } = await AuthServices.loginService(body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        user,
        message: "User login successfully",
        accessToken
    });
}

const logoutController = async (req: AppRequest, res: Response) => {
    const token = req.cookies.refreshToken;

    if(!token) {
        throw new UnauthorizedError("No refresh token provided");
    }

    await AuthServices.logoutService(token);
    res.clearCookie("refreshToken", { path: "/auth" });

    return res.status(200).json({
        success: true,
        message: "Logout successfully"
    });
}

const refreshTokenController = async (req: AppRequest, res: Response) => {
    const token = req.cookies.refreshToken;

    if(!token) {
        throw new UnauthorizedError("No refresh token provided");
    }

    const { accessToken, refreshToken } = await AuthServices.refreshTokenService(token);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000
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