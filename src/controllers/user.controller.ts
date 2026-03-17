import { Response } from "express";
import { AuthenticatedRequest } from "../types/request.types";
import { UserService } from "../services/user.service";
import { getBody } from "../utils/getValidated";
import { ChangePasswordInput, UpdateProfileInput } from "../validators/user.validator";
import { BadRequestError } from "../errors/BadRequestError";

const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    const user = await UserService.getProfileService(req.user.id);
    return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user
    });
}

const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    const body = getBody<UpdateProfileInput>(req);
    const updatedUser = await UserService.updateProfileService(req.user.id, body.name);

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser
    });
}

const changePassword = async (req: AuthenticatedRequest, res: Response) => {
    const body = getBody<ChangePasswordInput>(req);
    await UserService.changePasswordService(req.user.id, body.currentPassword, body.newPassword);

    return res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
}

const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
    if(!req.file) {
        throw new BadRequestError("No image file provided");
    }

    const result = await UserService.uploadAvatarService(req.user.id, req.file.buffer);
    return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: result
    });
}

export const UserController = {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar
}