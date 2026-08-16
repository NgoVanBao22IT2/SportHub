const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('RBAC Security Tests', () => {
  let customerToken, ownerToken, adminToken;
  let customerId, ownerId, adminId;

  beforeAll(async () => {
    // Sync DB and clear users for testing
    await sequelize.sync({ force: true });
    
    // Create test accounts
    const customer = await User.create({ user_id: 'cust-test-1', email: 'cust@test.com', full_name: 'Cust', phone_number: '123', password_hash: 'hash', primary_role: 'CUSTOMER' });
    const owner = await User.create({ user_id: 'own-test-1', email: 'owner@test.com', full_name: 'Own', phone_number: '124', password_hash: 'hash', primary_role: 'OWNER' });
    const admin = await User.create({ user_id: 'admin-test-1', email: 'admin@test.com', full_name: 'Admin', phone_number: '125', password_hash: 'hash', primary_role: 'ADMIN' });

    customerId = customer.user_id;
    ownerId = owner.user_id;
    adminId = admin.user_id;

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'test_secret';
    customerToken = jwt.sign({ userId: customerId, role: 'CUSTOMER' }, secret);
    ownerToken = jwt.sign({ userId: ownerId, role: 'OWNER' }, secret);
    adminToken = jwt.sign({ userId: adminId, role: 'ADMIN' }, secret);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('CUSTOMER cannot access OWNER endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/owner/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('CUSTOMER cannot access ADMIN endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('OWNER cannot access ADMIN endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('ADMIN can access ADMIN endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.statusCode !== 200) console.log(res.body);
    expect(res.statusCode).toBe(200);
  });

  test('Unauthenticated user cannot access protected endpoints', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.statusCode).toBe(401);
  });

  test('IDOR: User cannot escalate role via Customer API', async () => {
    // If customer tries to update their profile with primary_role = ADMIN
    const res = await request(app)
      .put(`/api/v1/auth/profile`) // Fake endpoint logic, typically auth has no role update for customer
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ primary_role: 'ADMIN' });
    
    // We just verify it doesn't return 200 SUCCESS while updating role.
    expect(res.statusCode).not.toBe(200);
    
    // Verify DB still says CUSTOMER
    const dbUser = await User.findByPk(customerId);
    expect(dbUser.primary_role).toBe('CUSTOMER');
  });
});
