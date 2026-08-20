'use strict';

const multer = require('multer');

// Memory storage to process image directly with Sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (allowedMimetypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const err = new Error('Định dạng tệp không được hỗ trợ (Chỉ chấp nhận JPG, PNG, WEBP).');
    err.statusCode = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 30 // Max 30 files per upload request
  }
});

module.exports = upload;
