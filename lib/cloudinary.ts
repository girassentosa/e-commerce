import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      const base64String = file.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64String}`;
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
    console.error('Cloudinary upload error:', error);
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
    console.error('Cloudinary upload from URL error:', error);
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
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export { cloudinary };

