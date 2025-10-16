// ...existing code...
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(
    "Missing Cloudinary env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET"
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) throw new Error("File path is required");
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: CLOUDINARY_UPLOAD_FOLDER || "uploads",
    });
    console.log(
      "Cloudinary upload response url:",
      response.secure_url || response.url
    );
    try {
      await fs.unlink(localFilePath);
    } catch (e) {
      console.error("Failed to remove temp file:", e);
    }
    return response;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    try {
      await fs.unlink(localFilePath);
    } catch (_) {}
    const msg =
      err && (err.message || String(err))
        ? err.message || String(err)
        : "Unknown error";
    throw new Error("Cloudinary upload failed: " + msg);
  }
};
// ...existing code...
