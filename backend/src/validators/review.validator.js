'use strict';

/**
 * Validates request payload for creating a review
 */
function validateCreateReview(req, res, next) {
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || typeof bookingId !== 'string' || bookingId.trim() === '') {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Mã đơn đặt sân (bookingId) là bắt buộc và phải là chuỗi hợp lệ.'
    });
  }

  // Rating must be integer between 1 and 5
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Điểm đánh giá (rating) phải là số nguyên từ 1 đến 5 sao.'
    });
  }

  // Comment is optional, but if provided, validate length and type
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Nội dung nhận xét (comment) phải là chuỗi văn bản.'
      });
    }

    if (comment.trim().length > 2000) {
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Nội dung nhận xét không được vượt quá 2000 ký tự.'
      });
    }
  }

  req.validatedReview = {
    bookingId: bookingId.trim(),
    rating: parsedRating,
    comment: typeof comment === 'string' ? comment.trim() : null
  };

  next();
}

/**
 * Validates owner reply payload
 */
function validateOwnerReply(req, res, next) {
  const { replyContent } = req.body;

  if (!replyContent || typeof replyContent !== 'string' || replyContent.trim() === '') {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Nội dung phản hồi không được để trống.'
    });
  }

  if (replyContent.trim().length > 2000) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Nội dung phản hồi không được vượt quá 2000 ký tự.'
    });
  }

  req.validatedReply = {
    replyContent: replyContent.trim()
  };

  next();
}

module.exports = {
  validateCreateReview,
  validateOwnerReply
};
