import { AuthServices } from "../services/auth.service";
import { env } from "../config/env";
import { AppRequest } from "../types/request.types";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { Response } from "express";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { getBody } from "../utils/getValidated";

const signUpController = async (req: AppRequest, res: Response) => {
  const body = getBody<RegisterInput>(req);
  const { userId, message } = await AuthServices.registerService(body);
  return res.status(201).json({
    success: true,
    userId,
    message,
  });
};

const verifyEmailController = async (req: AppRequest, res: Response) => {
  const { userId, code } = req.body;
  const { user, accessToken, refreshToken } = await AuthServices.verifyEmailService(userId, code);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    success: true,
    user,
    message: "Email verified successfully",
    accessToken,
    refreshToken,
  });
};

const verifyTwoFactorController = async (req: AppRequest, res: Response) => {
  const { userId, code } = req.body;
  const { user, accessToken, refreshToken } = await AuthServices.verifyTwoFactorService(userId, code);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    success: true,
    user,
    message: "Two factor verified successfully",
    accessToken,
    refreshToken,
  });
};

const loginController = async (req: AppRequest, res: Response) => {
  const body = getBody<LoginInput>(req);
  const result = await AuthServices.loginService(body);

  // If 2FA is required
  if ('twoFactorRequired' in result) {
    return res.status(200).json({
      success: true,
      twoFactorRequired: true,
      userId: result.userId,
      message: "Two factor code sent to your email",
    });
  }

  const { user, accessToken, refreshToken } = result;
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    success: true,
    user,
    message: "User login successfully",
    accessToken,
    refreshToken,
  });
};

const logoutController = async (req: AppRequest, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new UnauthorizedError("No refresh token provided");
  await AuthServices.logoutService(token);
  res.clearCookie("refreshToken", { path: "/auth/refresh" });
  return res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
};

const refreshTokenController = async (req: AppRequest, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new UnauthorizedError("No refresh token provided");
  const { accessToken, refreshToken } = await AuthServices.refreshTokenService(token);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({ accessToken, refreshToken });
};

const toggleTwoFactorController = async (req: AppRequest, res: Response) => {
  const userId = req.user!.id;
  const { user, message } = await AuthServices.toggleTwoFactorService(userId);
  return res.status(200).json({
    success: true,
    user,
    message,
  });
};

const resendVerificationCodeController = async (req: AppRequest, res: Response) => {
  const { userId } = req.body;
  const { message } = await AuthServices.resendVerificationCodeService(userId);
  return res.status(200).json({ success: true, message });
};

const forgotPasswordController = async (req: AppRequest, res: Response) => {
  const { email } = req.body;
  const { message } = await AuthServices.forgotPasswordService(email);
  return res.status(200).json({ success: true, message });
}

const verifyResetOtpController = async (req: AppRequest, res: Response) => {
  const { email, code } = req.body;
  const { message } = await AuthServices.verifyResetOtpService(email, code);
  return res.status(200).json({ success: true, message });
}

const resetPasswordController = async (req: AppRequest, res: Response) => {
  const { email, code, newPassword} = req.body;
  const { message } = await AuthServices.resetPasswordService(email, code, newPassword);
  return res.status(200).json({ success: true, message });
}


export const AuthController = {
  signUpController,
  verifyEmailController,
  verifyTwoFactorController,
  toggleTwoFactorController,
  loginController,
  refreshTokenController,
  logoutController,
  resendVerificationCodeController,
  forgotPasswordController,
  verifyResetOtpController,
  resetPasswordController
};