const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Helper to upload audio recording buffer or file path to Cloudinary
 * @param {string|Buffer} fileInput - File path or buffer
 * @param {string} folder - Destination folder in Cloudinary (e.g. 'salintinig/audio')
 */
const uploadAudio = async (fileInput, folder = 'salintinig/audio') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileInput,
      {
        resource_type: 'video', // Cloudinary uses 'video' resource type for audio files (MP3, WAV, M4A)
        folder: folder,
        format: 'mp3', // Normalizes all student recordings to clean MP3 format
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          duration: result.duration, // Audio duration in seconds
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
  });
};

module.exports = {
  cloudinary,
  uploadAudio,
};
