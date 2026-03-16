import multer from "multer";
import { BadRequestError } from "../errors/BadRequestError";

// Store file inmemory instead of disk
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow images
    if(file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new BadRequestError("Only image files are allowed") as any, false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});