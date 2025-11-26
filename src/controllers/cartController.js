const supabase = require('../config/database');

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, stock')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      const { data: updatedItem, error } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update cart' });
      }

      return res.json({
        message: 'Cart updated successfully',
        cartItem: updatedItem
      });
    }

    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .insert([{
        user_id: userId,
        product_id: productId,
        quantity,
        price_at_addition: product.price
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to add to cart' });
    }

    res.status(201).json({
      message: 'Product added to cart',
      cartItem
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          description,
          price,
          stock,
          image_url,
          categories (id, name)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }

    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price_at_addition) * item.quantity);
    }, 0);

    res.json({
      cartItems,
      summary: {
        itemCount: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total: total.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('*, products(stock)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.products.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const { data: updatedItem, error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update cart item' });
    }

    res.json({
      message: 'Cart item updated',
      cartItem: updatedItem
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to clear cart' });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
