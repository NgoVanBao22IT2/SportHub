'use strict';

const models = require('../models');

async function updateReviewsSchema() {
  try {
    const [cols] = await models.sequelize.query('DESCRIBE reviews');
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes('venue_id')) {
      await models.sequelize.query('ALTER TABLE reviews ADD COLUMN venue_id VARCHAR(36) NULL AFTER court_id, ADD INDEX idx_reviews_venue_id (venue_id)');
      console.log('✅ Added venue_id column and index to reviews table');
    }

    if (!colNames.includes('status')) {
      await models.sequelize.query("ALTER TABLE reviews ADD COLUMN status ENUM('PUBLISHED', 'HIDDEN') NOT NULL DEFAULT 'PUBLISHED' AFTER comment");
      console.log('✅ Added status column to reviews table');
    }

    const [indexes] = await models.sequelize.query('SHOW INDEXES FROM reviews');
    const hasUniqueBooking = indexes.some(i => i.Column_name === 'booking_id' && !i.Non_unique);
    if (!hasUniqueBooking) {
      try {
        await models.sequelize.query('ALTER TABLE reviews ADD UNIQUE INDEX uq_reviews_booking_id (booking_id)');
        console.log('✅ Added unique constraint on booking_id');
      } catch (err) {
        console.log('Unique index info:', err.message);
      }
    }

    console.log('✅ Reviews schema update complete');
  } catch (err) {
    console.error('❌ Error updating reviews schema:', err);
  }
}

updateReviewsSchema().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
