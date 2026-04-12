import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_API_KEY!,
  api_secret: process.env.CLOUD_API_SECRET!,
});

export const createUploader = (folder: string) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isPdf = file.mimetype === "application/pdf";

      // Clean file name: remove extension, trim spaces, replace spaces with _
      const fileName = file.originalname
        .replace(/\.[^/.]+$/, "")
        .trim()
        .replace(/\s+/g, "_");

      return {
        folder,
        resource_type: isPdf ? "raw" : "image",
        public_id: fileName,
        format: isPdf ? "pdf" : undefined, // <-- this is the key
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      };
    },
  });

  return multer({ storage });
};
