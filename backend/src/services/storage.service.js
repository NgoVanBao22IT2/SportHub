'use strict';

const path = require('path');
const cloudinary = require('../config/cloudinary');

class StorageService {
  /**
   * Validate image file format, size, and MIME type.
   * Enforces max 10MB size limit and allowed web formats.
   */
  static validateImage(file) {
    if (!file) {
      const err = new Error('Chưa chọn file hình ảnh.');
      err.statusCode = 400;
      throw err;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

    const mimeType = file.mimetype || file.type || '';
    const originalName = file.originalname || file.name || '';
    const ext = path.extname(originalName).toLowerCase();
    const size = file.size || (file.buffer ? file.buffer.length : 0);

    // Size limit: 10MB
    if (size > 10 * 1024 * 1024) {
      const err = new Error('Ảnh vượt quá dung lượng cho phép (Tối đa 10MB).');
      err.statusCode = 400;
      throw err;
    }

    // MIME and Extension validation
    if (mimeType && !allowedMimeTypes.includes(mimeType.toLowerCase())) {
      const err = new Error('Định dạng ảnh không được hỗ trợ (Chỉ chấp nhận JPG, JPEG, PNG, WEBP, AVIF).');
      err.statusCode = 400;
      throw err;
    }

    if (ext && !allowedExtensions.includes(ext)) {
      const err = new Error('Định dạng mở rộng của tệp ảnh không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Upload buffer directly to Cloudinary using upload_stream.
   * Zero local file system writing (no local media/ or public/uploads/ usage).
   * 
   * @param {Buffer} buffer - File buffer from multer memoryStorage
   * @param {Object} options - Custom Cloudinary upload options
   * @returns {Promise<{ secure_url: string, public_id: string, width: number, height: number, format: string, bytes: number }>}
   */
  static async uploadToCloudinary(buffer, options = {}) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      const err = new Error('Dữ liệu bộ đệm (buffer) ảnh không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }

    const uploadOptions = {
      folder: options.folder || 'sporthub/venues',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          const err = new Error(`Lỗi tải ảnh lên Cloudinary: ${error.message}`);
          err.statusCode = 502;
          return reject(err);
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      });

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload Base64 Data URI directly to Cloudinary.
   * 
   * @param {string} dataUrl - e.g. "data:image/jpeg;base64,..."
   * @param {Object} options - Custom Cloudinary upload options
   */
  static async uploadBase64ToCloudinary(dataUrl, options = {}) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      const err = new Error('Định dạng chuỗi Base64 ảnh không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }

    const uploadOptions = {
      folder: options.folder || 'sporthub/venues',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    try {
      const result = await cloudinary.uploader.upload(dataUrl, uploadOptions);
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('[Cloudinary Base64 Upload Error]', error);
      const err = new Error(`Lỗi tải ảnh Base64 lên Cloudinary: ${error.message}`);
      err.statusCode = 502;
      throw err;
    }
  }

  /**
   * Delete image asset from Cloudinary using public_id.
   * Safe execution with no-op on empty or non-Cloudinary identifiers.
   * 
   * @param {string} publicId - Cloudinary public_id
   */
  static async deleteFromCloudinary(publicId) {
    if (!publicId || typeof publicId !== 'string' || publicId.trim() === '') {
      return { result: 'ignored' };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId.trim());
      return result;
    } catch (err) {
      console.warn(`[Cloudinary Destroy Warning] Could not delete ${publicId}:`, err.message);
      return { result: 'error', error: err.message };
    }
  }

  /**
   * Generate dynamic transformed image URL based on requested variant.
   * Supports Cloudinary dynamic transformations on-the-fly and seamlessly falls back
   * to the original URL for legacy non-Cloudinary images.
   * 
   * Variants:
   * - 'thumbnail': 300x200 crop fill, auto quality/format
   * - 'medium': 800x600 fit inside, auto quality/format
   * - 'large': 1400x900 fit inside, auto quality/format
   * - 'original': untouched original URL
   * 
   * @param {string} url - Original image URL
   * @param {'thumbnail'|'medium'|'large'|'original'} variant
   * @returns {string} Transformed or original URL
   */
  static getTransformedUrl(url, variant = 'original') {
    if (!url || typeof url !== 'string') return url;

    // Only inject transformation if it is a Cloudinary upload URL
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      const transforms = {
        thumbnail: 'c_fill,h_200,w_300,q_auto,f_auto',
        medium: 'c_limit,h_600,w_800,q_auto,f_auto',
        large: 'c_limit,h_900,w_1400,q_auto,f_auto'
      };

      const transformStr = transforms[variant];
      if (!transformStr) return url;

      if (url.includes(`/upload/${transformStr}/`)) return url;
      return url.replace('/upload/', `/upload/${transformStr}/`);
    }

    return url;
  }

  /**
   * Backward compatibility adapter for saveImageBuffer.
   * Uploads to Cloudinary and returns standardized structure.
   */
  static async saveImageBuffer(buffer, originalFilename = 'image.jpg') {
    const uploadResult = await this.uploadToCloudinary(buffer, {
      public_id: `${Date.now()}_${path.parse(originalFilename).name.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    });

    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      original_url: uploadResult.secure_url,
      image_url: uploadResult.secure_url,
      thumbnail_url: this.getTransformedUrl(uploadResult.secure_url, 'thumbnail'),
      medium_url: this.getTransformedUrl(uploadResult.secure_url, 'medium'),
      large_url: this.getTransformedUrl(uploadResult.secure_url, 'large'),
      file_size: uploadResult.bytes,
      mime_type: `image/${uploadResult.format || 'webp'}`
    };
  }

  /**
   * Backward compatibility adapter for saveBase64Image.
   */
  static async saveBase64Image(dataUrl, titleHint = 'image') {
    const uploadResult = await this.uploadBase64ToCloudinary(dataUrl, {
      public_id: `${Date.now()}_${String(titleHint).replace(/[^a-zA-Z0-9_-]/g, '_')}`
    });

    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      original_url: uploadResult.secure_url,
      image_url: uploadResult.secure_url,
      thumbnail_url: this.getTransformedUrl(uploadResult.secure_url, 'thumbnail'),
      medium_url: this.getTransformedUrl(uploadResult.secure_url, 'medium'),
      large_url: this.getTransformedUrl(uploadResult.secure_url, 'large'),
      file_size: uploadResult.bytes,
      mime_type: `image/${uploadResult.format || 'webp'}`
    };
  }

  /**
   * Backward compatibility adapter for deleteFile.
   * If input is Cloudinary public_id or Cloudinary URL, deletes from Cloudinary.
   */
  static async deleteFile(relativePathOrUrl) {
    if (!relativePathOrUrl || typeof relativePathOrUrl !== 'string') return;

    if (relativePathOrUrl.includes('res.cloudinary.com')) {
      // Extract public_id from Cloudinary URL: between /upload/(v.../)? and the extension
      try {
        const matches = relativePathOrUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (matches && matches[1]) {
          await this.deleteFromCloudinary(matches[1]);
        }
      } catch (e) {
        console.warn('Could not extract Cloudinary public_id from URL:', relativePathOrUrl);
      }
    }
  }
}

module.exports = StorageService;
