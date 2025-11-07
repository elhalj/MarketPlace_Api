import { v2 as cloudinary } from 'cloudinary';
import { UploadApiOptions, UploadApiResponse, TransformationOptions } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true, // Always use HTTPS
});

export interface UploadResult {
  publicId: string;
  url: string;
  format: string;
  width: number;
  height: number;
}

export async function uploadImage(
  file: string,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: TransformationOptions[];
  } = {}
): Promise<UploadResult> {
  try {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder || 'marketplace',
      public_id: options.publicId,
      transformation: options.transformation,
      resource_type: 'auto',
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

export async function generateImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  } = {}
): Promise<string> {
  const transformation: TransformationOptions[] = [];

  if (options.width || options.height) {
    transformation.push({
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
    } as TransformationOptions);
  }

  if (options.quality) {
    transformation.push({ quality: options.quality } as TransformationOptions);
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation,
    format: options.format,
  });
}

export async function optimizeImage(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): Promise<UploadResult> {
  const transformation = [
    {
      width: options.width || 'auto',
      height: options.height || 'auto',
      crop: 'scale',
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
    },
  ];

  try {
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      transformation,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary optimization error:', error);
    throw new Error('Failed to optimize image');
  }
}
