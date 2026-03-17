import cloudinary from "../config/cloudinary"
import { logger } from "./logger";

export const  uploadImage = (
    buffer: Buffer,
    folder: string,
    publicId?: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                overwrite: true,
                transformation: [
                    {
                        width: 500, height: 500, crop: "fill", // auto resize
                    },
                    {
                        quality: "auto", // auto optimize quality
                    },
                ],
            },
            (error, result) => {
                if(error) reject(error);
                else resolve(result!.secure_url);

                logger.error(`Cloudinary upload failed`, error);
            }
        );
        uploadStream.end(buffer);
        logger.info(`Image uploaded to Cloudinary`, { folder, publicId });
    });
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
    // Extract public_id from URL
    const parts = imageUrl.split("/");
    const folerAndFile = parts.slice(-2).join("/");
    const publicId = folerAndFile.replace(/\.[^/.]+$/, ""); // remove extenstion
    await cloudinary.uploader.destroy(publicId);
}