const supabase = require('../config/database');

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*, products(id, stock)')
      .eq('user_id', userId);

    if (cartError) {
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cartItems) {
      if (item.products.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product ${item.product_id}`
        });
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price_at_addition) * item.quantity);
    }, 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        total_amount: totalAmount,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_addition
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ error: 'Failed to create order items' });
    }

    for (const item of cartItems) {
      await supabase
        .from('products')
        .update({
          stock: item.products.stock - item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);
    }

    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (id, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = supabase
      .from('orders')
      .select(`
        *,
        users (id, email),
        order_items (
          *,
          products (id, name, description, image_url)
        )
      `)
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};
