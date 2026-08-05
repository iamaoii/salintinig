const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Supabase Init] URL:', supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'MISSING');
console.log('[Supabase Init] KEY:', supabaseServiceKey ? supabaseServiceKey.slice(0, 20) + '...' : 'MISSING');

let supabase = null;

if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[Supabase Init] ✅ Client initialized successfully');
  } catch (e) {
    console.warn('[Supabase Init] ❌ SDK initialization failed:', e.message);
  }
} else {
  console.warn('[Supabase Init] ❌ Missing or invalid env vars. URL starts with http?', supabaseUrl?.startsWith('http'));
}

/**
 * Upload an image (base64 Data URL or Buffer) to Supabase Storage
 * @param {string|Buffer} fileInput - Base64 Data URL string or Buffer
 * @param {string} fileName - Destination filename in bucket
 * @param {string} bucketName - Supabase storage bucket (default: 'avatars')
 * @returns {Promise<string|null>} Public URL of uploaded image
 */
async function uploadImageToSupabase(fileInput, fileName = null, bucketName = 'avatars') {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env');
    return null;
  }

  try {
    let buffer;
    let contentType = 'image/webp';
    let ext = 'webp';

    if (typeof fileInput === 'string' && fileInput.startsWith('data:')) {
      const matches = fileInput.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        ext = contentType.split('/')[1] || 'webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(fileInput, 'base64');
      }
    } else if (Buffer.isBuffer(fileInput)) {
      buffer = fileInput;
    } else {
      return null;
    }

    const filePath = fileName || `avatar_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded to Supabase Storage:', publicUrlData?.publicUrl);
    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('❌ Failed to upload image to Supabase Storage:', err.message);
    return null;
  }
}

module.exports = {
  supabase,
  uploadImageToSupabase,
};
