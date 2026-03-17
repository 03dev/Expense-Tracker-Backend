import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { UserRepository } from "../repositories/user.repository"
import { deleteImage, uploadImage } from "../utils/cloudinary.utils";
import { TokenUtils } from "../utils/token.utils";

const getProfileService = async (userId: string) => {
    const user = await UserRepository.findUserById(userId);

    if(!user) {
        throw new NotFoundError("User not found");
    }

    return user;
}

const updateProfileService = async (userId: string, name: string) => {
    const user = await UserRepository.findUserById(userId);

    if(!user) {
        throw new NotFoundError("User not found");
    }

    const updateUser = await UserRepository.updateProfile(userId, name);
    return updateUser;
}

const changePasswordService = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await UserRepository.userDetails(userId);

    if(!user) {
        throw new NotFoundError("User not found");
    }

    const isPasswordValid = await TokenUtils.compareFunction(currentPassword, user.password);

    if(!isPasswordValid) {
        throw new BadRequestError("Invalid password");
    }

    const hashedPassword = await TokenUtils.hashedFunction(newPassword);
    await UserRepository.updatePassword(userId, hashedPassword);
}

const uploadAvatarService = async (userId: string, buffer: Buffer) => {
    const user = await UserRepository.userDetails(userId);

    if(!user) {
        throw new NotFoundError("User not found");
    }

    if(user?.avatarUrl) {
        await deleteImage(user.avatarUrl);
    }

    const newAvatarUrl = await uploadImage(buffer, "avatars", `user_${userId}`);
    return UserRepository.updateAvatar(userId, newAvatarUrl);
}

export const UserService = {
  getProfileService,
  updateProfileService,
  changePasswordService,
  uploadAvatarService
}