import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { deleteImage, uploadImage } from "../utils/cloudinary.utils";
import { TokenUtils } from "../utils/token.utils";

const getProfileService = async (userId: string) => {
  return userRepository.findUserById(userId);
};

const updateProfileService = async (userId: string, name: string) => {
  return userRepository.updateProfile(userId, name);
};

const changePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await userRepository.getUserWithPassword(userId);
  if (!user) throw new NotFoundError("User not found");

  const isPasswordValid = await TokenUtils.compareFunction(currentPassword, user.password);
  if (!isPasswordValid) throw new BadRequestError("Invalid password");

  const hashedPassword = await TokenUtils.hashedFunction(newPassword);
  await userRepository.updatePassword(userId, hashedPassword);

  // Invalidate all active sessions â€” old tokens must not work after a password change
  await refreshTokenRepository.deleteAllRefreshTokens(userId);
};

const uploadAvatarService = async (userId: string, buffer: Buffer) => {
  const user = await userRepository.findUserById(userId);

  if (user?.avatarUrl) {
    await deleteImage(user.avatarUrl);
  }

  const newAvatarUrl = await uploadImage(buffer, "avatars", `user_${userId}`);
  return userRepository.updateAvatar(userId, newAvatarUrl);
};

export const UserService = {
  getProfileService,
  updateProfileService,
  changePasswordService,
  uploadAvatarService,
};
