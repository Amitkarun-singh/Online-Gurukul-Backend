import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const lastPart = parts.pop();
  const publicId = lastPart.split('.')[0];
  return publicId;
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Remove the local file after upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // Remove the local file if the upload fails
    fs.unlinkSync(localFilePath);
    throw error;
  }
};

const deleteFromCloudinary = async (cloudinaryFilePath) => {
  try {
      if (!cloudinaryFilePath)  {
          throw new ApiError(
              400, 
              "Invalid URL of cloudinary asset"
          )
      }
      const publicId = getPublicIdFromUrl(cloudinaryFilePath);
      const response = await cloudinary.uploader.destroy(publicId);
      console.log(response);
      return response;
  } catch (error) {
      throw new ApiError(
          400, 
          error?.message || "Error occured while destroying the asset"
      )
      return null;
  }
}

export { 
  uploadOnCloudinary, 
  deleteFromCloudinary, 
};