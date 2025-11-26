const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/database');

describe('Cart API', () => {
  let customerToken;
  let adminToken;
  let testProductId;
  let testCategoryId;
  let cartItemId;
  let customerUserId;
  let adminUserId;

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
        name: `Category ${Date.now()}`,
        description: 'Test'
      });

    testCategoryId = categoryRes.body.category.id;

    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Cart Test Product',
        description: 'Test',
        price: 50.00,
        stock: 100,
        categoryId: testCategoryId
      });

    testProductId = productRes.body.product.id;
  });

  afterAll(async () => {
    if (customerUserId) {
      await supabase.from('cart_items').delete().eq('user_id', customerUserId);
    }
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

  describe('POST /api/cart', () => {
    it('should add product to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 2
        });

      expect(res.status).toBe(201);
      expect(res.body.cartItem).toHaveProperty('product_id', testProductId);
      expect(res.body.cartItem).toHaveProperty('quantity', 2);
      cartItemId = res.body.cartItem.id;
    });

    it('should update quantity if product already in cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.cartItem).toHaveProperty('quantity', 5);
    });

    it('should validate product exists', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: fakeId,
          quantity: 1
        });

      expect(res.status).toBe(404);
    });

    it('should validate quantity is positive', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 0
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/cart', () => {
    it('should get user cart', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('cartItems');
      expect(res.body).toHaveProperty('summary');
      expect(Array.isArray(res.body.cartItems)).toBe(true);
    });

    it('should calculate cart total correctly', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toHaveProperty('total');
      expect(parseFloat(res.body.summary.total)).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/cart/:id', () => {
    it('should update cart item quantity', async () => {
      const res = await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          quantity: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.cartItem).toHaveProperty('quantity', 3);
    });

    it('should validate quantity', async () => {
      const res = await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          quantity: 0
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/cart/:id', () => {
    it('should remove item from cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear entire cart', async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 1
        });

      const res = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);

      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cartRes.body.cartItems.length).toBe(0);
    });
  });
});
