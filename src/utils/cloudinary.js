import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) throw new Error('File path is required');
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' });
        console.log('Cloudinary upload response secure_url:', response.secure_url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error.message);
        throw error;
    }
};

export { uploadOnCloudinary };
