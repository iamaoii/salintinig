const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { denoiseAudio } = require('../utils/audioDenoise.util.js');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Helper to upload audio recording buffer or file path to Cloudinary (with FFmpeg RNNoise/afftdn Denoising)
 * @param {string|Buffer} fileInput - File path or buffer
 * @param {string} folder - Destination folder in Cloudinary (e.g. 'salintinig/audio')
 */
const uploadAudio = async (fileInput, folder = 'salintinig/audio') => {
  let fileToUpload = fileInput;

  // Upload student's natural original audio for teacher playback
  if (typeof fileInput === 'string' && fs.existsSync(fileInput)) {
    try {
      const denoiseResult = await denoiseAudio(fileInput);
      fileToUpload = typeof denoiseResult === 'string' ? denoiseResult : (denoiseResult.originalPath || fileInput);
    } catch (e) {
      console.warn('[CloudinaryUpload] Audio denoise notice:', e.message);
    }
  }

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        fileToUpload,
        {
          resource_type: 'video', // Cloudinary uses 'video' resource type for audio files (MP3, WAV, M4A)
          folder: folder,
          format: 'mp3', // Normalizes all student recordings to clean MP3 format
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      duration: result.duration, // Audio duration in seconds
      format: result.format,
      bytes: result.bytes,
    };
  } finally {
    // 🧹 Auto-cleanup temp original audio file and intermediate denoised wav files
    if (typeof fileInput === 'string') {
      const { cleanupTempAudio } = require('../utils/audioDenoise.util.js');
      cleanupTempAudio(fileInput);
    }
  }
};

module.exports = {
  cloudinary,
  uploadAudio,
};
