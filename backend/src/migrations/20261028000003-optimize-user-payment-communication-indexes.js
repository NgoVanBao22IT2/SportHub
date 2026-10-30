'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const safeAddIndex = async (tableName, columns, options) => {
      try {
        const [existingIndexes] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${options.name}'`
        );
        if (existingIndexes.length === 0) {
          await queryInterface.addIndex(tableName, columns, options);
          console.log(`[Migration] Added index ${options.name} on ${tableName}`);
        } else {
          console.log(`[Migration] Index ${options.name} already exists on ${tableName}, skipping.`);
        }
      } catch (err) {
        console.warn(`[Migration Warning] Could not add index ${options.name} on ${tableName}:`, err.message);
      }
    };

    // 1. Table: users
    // Eliminates Full Table Scan when filtering by role and account status
    await safeAddIndex('users', ['primary_role', 'account_status'], {
      name: 'idx_users_role_status'
    });

    // 2. Table: payments
    await safeAddIndex('payments', ['user_id', 'created_at'], {
      name: 'idx_payments_user_created'
    });

    await safeAddIndex('payments', ['payment_status', 'created_at'], {
      name: 'idx_payments_status_created'
    });

    await safeAddIndex('payments', ['provider_trans_id'], {
      name: 'idx_payments_provider_trans'
    });

    // 3. Table: payment_ipn_logs
    await safeAddIndex('payment_ipn_logs', ['provider_order_id', 'processing_status'], {
      name: 'idx_ipn_logs_provider_order'
    });

    // 4. Table: refund_transactions
    await safeAddIndex('refund_transactions', ['refund_status', 'created_at'], {
      name: 'idx_refund_trans_status_created'
    });

    // 5. Table: notifications
    // Eliminates filesort and accelerates unread count
    await safeAddIndex('notifications', ['recipient_user_id', 'is_read', 'created_at'], {
      name: 'idx_notifications_user_read_created'
    });

    await safeAddIndex('notifications', ['recipient_user_id', 'created_at'], {
      name: 'idx_notifications_user_created'
    });

    // 6. Table: reviews
    await safeAddIndex('reviews', ['venue_id', 'status', 'created_at'], {
      name: 'idx_reviews_venue_status_created'
    });

    // 7. Table: refresh_tokens
    await safeAddIndex('refresh_tokens', ['user_id', 'expires_at', 'is_revoked'], {
      name: 'idx_refresh_tokens_user_expiry'
    });

    // 8. Table: otp_verifications
    await safeAddIndex('otp_verifications', ['email', 'purpose', 'is_consumed', 'expires_at'], {
      name: 'idx_otp_verifications_lookup'
    });

    // 9. Table: password_reset_tokens
    await safeAddIndex('password_reset_tokens', ['user_id', 'expires_at', 'is_consumed'], {
      name: 'idx_pwd_reset_tokens_user_expiry'
    });

    // 10. Table: owner_registrations
    await safeAddIndex('owner_registrations', ['status', 'created_at'], {
      name: 'idx_owner_reg_status_created'
    });

    // 11. Table: community_posts
    await safeAddIndex('community_posts', ['status', 'created_at'], {
      name: 'idx_comm_posts_status_created'
    });

    // 12. Table: venue_posts
    await safeAddIndex('venue_posts', ['venue_id', 'status', 'publish_at'], {
      name: 'idx_venue_posts_venue_status_pub'
    });

    // 13. Table: venue_post_images
    await safeAddIndex('venue_post_images', ['post_id', 'display_order'], {
      name: 'idx_venue_post_images_post_order'
    });

    // 14. Table: banners
    await safeAddIndex('banners', ['page_key', 'is_active'], {
      name: 'idx_banners_page_active'
    });

    // 15. Table: post_applications (add unique constraint on post_id + applicant_user_id)
    await safeAddIndex('post_applications', ['post_id', 'applicant_user_id'], {
      name: 'uq_post_applications_post_user',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        const [existingIndexes] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${indexName}'`
        );
        if (existingIndexes.length > 0) {
          await queryInterface.removeIndex(tableName, indexName);
          console.log(`[Rollback] Removed index ${indexName} from ${tableName}`);
        }
      } catch (err) {
        console.warn(`[Rollback Warning] Could not remove index ${indexName} from ${tableName}:`, err.message);
      }
    };

    await safeRemoveIndex('post_applications', 'uq_post_applications_post_user');
    await safeRemoveIndex('banners', 'idx_banners_page_active');
    await safeRemoveIndex('venue_post_images', 'idx_venue_post_images_post_order');
    await safeRemoveIndex('venue_posts', 'idx_venue_posts_venue_status_pub');
    await safeRemoveIndex('community_posts', 'idx_comm_posts_status_created');
    await safeRemoveIndex('owner_registrations', 'idx_owner_reg_status_created');
    await safeRemoveIndex('password_reset_tokens', 'idx_pwd_reset_tokens_user_expiry');
    await safeRemoveIndex('otp_verifications', 'idx_otp_verifications_lookup');
    await safeRemoveIndex('refresh_tokens', 'idx_refresh_tokens_user_expiry');
    await safeRemoveIndex('reviews', 'idx_reviews_venue_status_created');
    await safeRemoveIndex('notifications', 'idx_notifications_user_created');
    await safeRemoveIndex('notifications', 'idx_notifications_user_read_created');
    await safeRemoveIndex('refund_transactions', 'idx_refund_trans_status_created');
    await safeRemoveIndex('payment_ipn_logs', 'idx_ipn_logs_provider_order');
    await safeRemoveIndex('payments', 'idx_payments_provider_trans');
    await safeRemoveIndex('payments', 'idx_payments_status_created');
    await safeRemoveIndex('payments', 'idx_payments_user_created');
    await safeRemoveIndex('users', 'idx_users_role_status');
  }
};
