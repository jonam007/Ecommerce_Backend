const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/database');

describe('Orders API', () => {
  let customerToken;
  let adminToken;
  let testProductId;
  let testCategoryId;
  let testOrderId;
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
        name: 'Order Test Product',
        description: 'Test',
        price: 100.00,
        stock: 50,
        categoryId: testCategoryId
      });

    testProductId = productRes.body.product.id;
  });

  afterAll(async () => {
    if (customerUserId) {
      await supabase.from('order_items').delete().match({ order_id: testOrderId });
      await supabase.from('orders').delete().eq('user_id', customerUserId);
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

  describe('POST /api/orders', () => {
    it('should not create order with empty cart', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cart is empty');
    });

    it('should create order from cart', async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 2
        });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(201);
      expect(res.body.order).toHaveProperty('user_id', customerUserId);
      expect(res.body.order).toHaveProperty('total_amount');
      expect(res.body.order).toHaveProperty('status', 'pending');
      testOrderId = res.body.order.id;

      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cartRes.body.cartItems.length).toBe(0);
    });

    it('should maintain price from cart (persistent pricing)', async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 1
        });

      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      const cartPrice = parseFloat(cartRes.body.cartItems[0].price_at_addition);

      await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 999.99
        });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(parseFloat(orderRes.body.order.total_amount)).toBe(cartPrice);
    });
  });

  describe('GET /api/orders', () => {
    it('should get user orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should get all orders as admin', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by id', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order).toHaveProperty('id', testOrderId);
      expect(res.body.order).toHaveProperty('order_items');
    });

    it('should not get other users order', async () => {
      const otherCustomerEmail = `othercustomer${Date.now()}@example.com`;
      const otherRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: otherCustomerEmail,
          password: 'password123',
          role: 'customer'
        });

      const res = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${otherRes.body.token}`);

      expect(res.status).toBe(404);

      await supabase.from('users').delete().eq('id', otherRes.body.user.id);
    });

    it('should allow admin to get any order', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order).toHaveProperty('id', testOrderId);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order status as admin', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'processing'
        });

      expect(res.status).toBe(200);
      expect(res.body.order).toHaveProperty('status', 'processing');
    });

    it('should not update order status as customer', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'completed'
        });

      expect(res.status).toBe(403);
    });

    it('should validate status value', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(res.status).toBe(400);
    });
  });
});
