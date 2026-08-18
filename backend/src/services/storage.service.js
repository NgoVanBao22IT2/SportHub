'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Create upload directories if not exist
const PUBLIC_DIR = path.join(__dirname, '../../public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const THUMB_DIR = path.join(UPLOADS_DIR, 'thumbnails');
const MEDIUM_DIR = path.join(UPLOADS_DIR, 'medium');
const LARGE_DIR = path.join(UPLOADS_DIR, 'large');
const ORIGINAL_DIR = path.join(UPLOADS_DIR, 'originals');

[PUBLIC_DIR, UPLOADS_DIR, THUMB_DIR, MEDIUM_DIR, LARGE_DIR, ORIGINAL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class StorageService {
  /**
   * Validate image file format, size, and MIME type.
   */
  static validateImage(file) {
    if (!file) {
      throw new Error('Chưa chọn file hình ảnh.');
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
      const err = new Error('Định dạng ảnh không được hỗ trợ (Chỉ chấp nhận JPG, JPEG, PNG, WEBP).');
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
   * Process raw buffer and save optimized image variants (Thumbnail, Medium, Large, Original WebP)
   */
  static async saveImageBuffer(buffer, originalFilename = 'image.jpg') {
    const filenameHash = crypto.randomBytes(16).toString('hex');
    const baseName = `${Date.now()}_${filenameHash}`;

    const thumbFilename = `${baseName}_thumb.webp`;
    const mediumFilename = `${baseName}_medium.webp`;
    const largeFilename = `${baseName}_large.webp`;
    const originalFilenameWebp = `${baseName}_orig.webp`;

    const thumbPath = path.join(THUMB_DIR, thumbFilename);
    const mediumPath = path.join(MEDIUM_DIR, mediumFilename);
    const largePath = path.join(LARGE_DIR, largeFilename);
    const originalPath = path.join(ORIGINAL_DIR, originalFilenameWebp);

    // 1. Process Thumbnail (300x200 crop/fit)
    await sharp(buffer)
      .resize(300, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    // 2. Process Medium (800x600 fit inside)
    await sharp(buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(mediumPath);

    // 3. Process Large (1400x900 fit inside)
    await sharp(buffer)
      .resize(1400, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(largePath);

    // 4. Process Original WebP
    await sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 92 })
      .toFile(originalPath);

    return {
      image_url: `/uploads/large/${largeFilename}`,
      thumbnail_url: `/uploads/thumbnails/${thumbFilename}`,
      medium_url: `/uploads/medium/${mediumFilename}`,
      large_url: `/uploads/large/${largeFilename}`,
      original_url: `/uploads/originals/${originalFilenameWebp}`,
      file_size: buffer.length,
      mime_type: 'image/webp'
    };
  }

  /**
   * Process Base64 Data URL and save optimized image variants
   */
  static async saveBase64Image(dataUrl, titleHint = 'image') {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      throw new Error('Định dạng chuỗi Base64 ảnh không hợp lệ.');
    }

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Chuỗi dữ liệu Base64 bị lỗi.');
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    if (imageBuffer.length > 10 * 1024 * 1024) {
      const err = new Error('Ảnh vượt quá dung lượng cho phép (Tối đa 10MB).');
      err.statusCode = 400;
      throw err;
    }

    return await this.saveImageBuffer(imageBuffer, titleHint);
  }

  /**
   * Delete image file variants from storage
   */
  static async deleteFile(relativePathOrUrl) {
    if (!relativePathOrUrl || relativePathOrUrl.startsWith('http://') || relativePathOrUrl.startsWith('https://')) {
      return;
    }

    try {
      const cleanPath = relativePathOrUrl.replace(/^\/uploads\//, '');
      const fullPath = path.join(UPLOADS_DIR, cleanPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.warn('StorageService.deleteFile warning:', err.message);
    }
  }
}

module.exports = StorageService;
