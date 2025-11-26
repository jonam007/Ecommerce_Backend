const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/database');

describe('Products API', () => {
  let adminToken;
  let customerToken;
  let testProductId;
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

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Category ${Date.now()}`,
        description: 'Test'
      });

    testCategoryId = categoryRes.body.category.id;
  });

  afterAll(async () => {
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }
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

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          description: 'Test description',
          price: 99.99,
          stock: 50,
          categoryId: testCategoryId
        });

      expect(res.status).toBe(201);
      expect(res.body.product).toHaveProperty('name', 'Test Product');
      expect(res.body.product).toHaveProperty('price', '99.99');
      testProductId = res.body.product.id;
    });

    it('should not create product as customer', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Product',
          price: 50,
          stock: 10
        });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product without price'
        });

      expect(res.status).toBe(400);
    });

    it('should validate price is positive', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product',
          price: -10,
          stock: 5
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('products');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('should filter products by price range', async () => {
      const res = await request(app)
        .get('/api/products?minPrice=50&maxPrice=150')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products.every(p => p.price >= 50 && p.price <= 150)).toBe(true);
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get(`/api/products?categoryId=${testCategoryId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products.every(p => p.category_id === testCategoryId)).toBe(true);
    });

    it('should search products by name', async () => {
      const res = await request(app)
        .get('/api/products?search=Test')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/products?page=1&limit=5')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      const res = await request(app)
        .get(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.product).toHaveProperty('id', testProductId);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product as admin', async () => {
      const res = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          price: 149.99
        });

      expect(res.status).toBe(200);
      expect(res.body.product).toHaveProperty('name', 'Updated Product');
    });

    it('should not update product as customer', async () => {
      const res = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Update'
        });

      expect(res.status).toBe(403);
    });
  });
});
