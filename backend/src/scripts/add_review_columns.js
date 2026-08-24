const models = require('../models');

(async () => {
  try {
    const [cols] = await models.sequelize.query('DESCRIBE reviews');
    const colNames = cols.map(c => c.Field);
    console.log('Current cols:', colNames);

    if (!colNames.includes('hide_reason')) {
      await models.sequelize.query('ALTER TABLE reviews ADD COLUMN hide_reason VARCHAR(255) NULL');
      console.log('Added hide_reason');
    }
    if (!colNames.includes('hide_request_status')) {
      await models.sequelize.query("ALTER TABLE reviews ADD COLUMN hide_request_status ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'NONE'");
      console.log('Added hide_request_status');
    }
    if (!colNames.includes('hide_requested_at')) {
      await models.sequelize.query('ALTER TABLE reviews ADD COLUMN hide_requested_at DATETIME NULL');
      console.log('Added hide_requested_at');
    }
    if (!colNames.includes('hide_resolved_at')) {
      await models.sequelize.query('ALTER TABLE reviews ADD COLUMN hide_resolved_at DATETIME NULL');
      console.log('Added hide_resolved_at');
    }
    console.log('All review columns ready!');
  } catch (err) {
    console.error('Migration error:', err);
  }
  process.exit(0);
})();
