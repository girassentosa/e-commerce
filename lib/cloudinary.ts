import { v2 as cloudinary } from 'cloudinary';

// Get and validate Cloudinary credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

// Configure Cloudinary
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  // Log configuration (without sensitive data)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Cloudinary configured:', {
      cloud_name: cloudName,
      api_key: apiKey ? `${apiKey.substring(0, 4)}...` : 'missing',
      api_secret: apiSecret ? '***' : 'missing',
    });
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Cloudinary not configured - will use local storage');
    console.warn('Missing:', {
      cloud_name: !cloudName,
      api_key: !apiKey,
      api_secret: !apiSecret,
    });
  }
}

export interface UploadResult {
  url: string;
  public_id: string;
  secure_url: string;
}

/**
 * Upload image file to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder path in Cloudinary (e.g., 'avatars', 'products')
 * @param publicId - Optional public ID (if not provided, Cloudinary will generate one)
 * @returns Upload result with URL and public_id
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string,
  publicId?: string
): Promise<UploadResult> {
  try {
    // Validate Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    }

    // Get current config for debugging
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
    }

    // Convert buffer to base64 if needed
    const uploadOptions: any = {
      folder,
      resource_type: 'image' as const,
      overwrite: false, // Don't overwrite existing images (keep old photos)
      unique_filename: true, // Generate unique filename
      use_filename: true,
    };

    // If publicId is provided, use it (but don't overwrite if exists)
    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    let uploadResult;
    if (Buffer.isBuffer(file)) {
      // Convert buffer to base64 data URI for Cloudinary
      // Use 'image/auto' to let Cloudinary auto-detect the image format
      const base64String = file.toString('base64');
      const dataUri = `data:image/auto;base64,${base64String}`;
      uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);
    } else {
      // Upload from base64 string or URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    }

    return {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
    };
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    
    // Provide more detailed error information
    if (error.http_code === 401) {
      const config = getCloudinaryConfigStatus();
      console.error('🔍 Cloudinary Config Status:', config);
      throw new Error(
        `Cloudinary authentication failed (401). ` +
        `Please verify your Cloudinary credentials are correct. ` +
        `Cloud name: "${config.cloud_name || 'NOT SET'}"`
      );
    }
    
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

/**
 * Upload image from URL to Cloudinary
 * @param imageUrl - URL of the image to download and upload
 * @param folder - Folder path in Cloudinary
 * @returns Upload result with URL and public_id
 */
export async function uploadFromUrlToCloudinary(
  imageUrl: string,
  folder: string
): Promise<UploadResult> {
  try {
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: 'image' as const,
      overwrite: false, // Don't overwrite existing images (keep old photos)
      unique_filename: true,
      use_filename: true,
    });

    return {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
    };
  } catch (error: any) {
    console.error('❌ Cloudinary upload from URL error:', error);
    
    // Provide more detailed error information
    if (error.http_code === 401) {
      const config = getCloudinaryConfigStatus();
      console.error('🔍 Cloudinary Config Status:', config);
      throw new Error(
        `Cloudinary authentication failed (401). ` +
        `Please verify your Cloudinary credentials are correct. ` +
        `Cloud name: "${config.cloud_name || 'NOT SET'}"`
      );
    }
    
    throw new Error(`Failed to upload from URL to Cloudinary: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary (optional - for cleanup if needed)
 * @param publicId - Public ID of the image to delete
 * @returns Deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error - just log it (we want to keep old photos)
    console.warn(`Failed to delete ${publicId} from Cloudinary (keeping old photo)`);
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  
  return !!(cloudName && apiKey && apiSecret);
}

/**
 * Get Cloudinary configuration status (for debugging)
 */
export function getCloudinaryConfigStatus() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  
  return {
    configured: !!(cloudName && apiKey && apiSecret),
    cloud_name: cloudName || null,
    api_key: apiKey ? `${apiKey.substring(0, 4)}...` : null,
    api_secret: apiSecret ? '***' : null,
  };
}

export { cloudinary };

