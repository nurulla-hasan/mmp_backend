import { v2 as Cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../config/index";

// Configure Cloudinary
Cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const cloudinary = Cloudinary;

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = "mmp/profiles",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result returned from Cloudinary."));
          resolve(result);
        },
      )
      .end(buffer);
  });
};

export const uploadDocumentToCloudinary = (
  buffer: Buffer,
  folder = "mmp/certificates",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result returned from Cloudinary."));
          resolve(result);
        },
      )
      .end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "raw" | "auto" = "image",
): Promise<void> => {
  if (!publicId) return;
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as "image" | "raw",
    });
    if (res.result !== "ok" && resourceType === "image") {
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    }
  } catch (error) {
    console.error("Failed to delete asset from Cloudinary:", error);
  }
};


