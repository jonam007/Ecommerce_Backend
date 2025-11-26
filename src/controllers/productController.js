const supabase = require('../config/database');

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    const productData = {
      name,
      description,
      price,
      stock,
      category_id: categoryId || null,
      image_url: imageUrl
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create product' });
    }

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      categoryId,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = supabase
      .from('products')
      .select('*, categories(id, name)', { count: 'exact' });

    if (minPrice) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: products, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(id, name)')
      .eq('id', id)
      .maybeSingle();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (req.file) updateData.image_url = req.file.path;

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
