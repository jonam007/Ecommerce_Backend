const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/database');

describe('Categories API', () => {
  let adminToken;
  let customerToken;
  let testCategoryId;
  let adminUserId;
  let customerUserId;

  beforeAll(async () => {
    const adminEmail = `admin${Date.now()}@example.com`;
    const customerEmail = `customer${Date.now()}@example.com`;

    const adminRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: adminEmail,
        password: 'password123',
        role: 'admin'
      });

    const customerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: customerEmail,
        password: 'password123',
        role: 'customer'
      });

    adminToken = adminRes.body.token;
    customerToken = customerRes.body.token;
    adminUserId = adminRes.body.user.id;
    customerUserId = customerRes.body.user.id;
  });

  afterAll(async () => {
    if (testCategoryId) {
      await supabase.from('categories').delete().eq('id', testCategoryId);
    }
    if (adminUserId) {
      await supabase.from('users').delete().eq('id', adminUserId);
    }
    if (customerUserId) {
      await supabase.from('users').delete().eq('id', customerUserId);
    }
  });

  describe('POST /api/categories', () => {
    it('should create category as admin', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Category ${Date.now()}`,
          description: 'Test description'
        });

      expect(res.status).toBe(201);
      expect(res.body.category).toHaveProperty('name');
      testCategoryId = res.body.category.id;
    });

    it('should not create category as customer', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Category',
          description: 'Test'
        });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing name'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/categories', () => {
    it('should get all categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should get category by id', async () => {
      const res = await request(app)
        .get(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.category).toHaveProperty('id', testCategoryId);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category as admin', async () => {
      const res = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.category).toHaveProperty('name', 'Updated Category Name');
    });

    it('should not update category as customer', async () => {
      const res = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Update'
        });

      expect(res.status).toBe(403);
    });
  });
});
