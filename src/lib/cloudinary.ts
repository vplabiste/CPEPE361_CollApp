import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({ 
    cloud_name: cloudName, 
    api_key: apiKey, 
    api_secret: apiSecret,
    secure: true
  });
} else {
    console.warn(
      '********************************************************************************\n' +
      '[Cloudinary Setup Check] CLOUDINARY IS NOT CONFIGURED.\n' +
      'File uploads will fail. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in your .env.local file.\n' +
      '********************************************************************************'
    );
}

export default cloudinary;
