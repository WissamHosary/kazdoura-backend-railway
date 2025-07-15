const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { handleFileUpload, handleUploadError } = require('../middleware/upload');
const { pool } = require('../config/database');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE'
    );
    const total = countResult[0].total;

    // Get products with pagination
    const [products] = await pool.execute(
      `SELECT * FROM products 
       WHERE is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Parse JSON fields
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : []
    }));

    // Pagination result
    const pagination = {};
    if (offset + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (offset > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      status: 'success',
      count: formattedProducts.length,
      pagination,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const product = products[0];
    // Parse JSON fields
    product.images = product.images ? JSON.parse(product.images) : [];
    product.tags = product.tags ? JSON.parse(product.tags) : [];
    if (product.color_stock) {
      try {
        product.color_stock = JSON.parse(product.color_stock);
      } catch (error) {
        console.log('⚠️ Invalid color_stock JSON for product', product.id);
        product.color_stock = null;
      }
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Public (temporarily for testing)
router.post('/', handleFileUpload, handleUploadError, async (req, res) => {
  try {
    console.log('🚀 Creating new product...');
    console.log('📝 Request body:', req.body);
    console.log('📁 Request files:', req.files);
    
    // Basic validation
    if (!req.body.name || !req.body.description || !req.body.price) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, description, and price are required'
      });
    }

    // Handle uploaded images
    const uploadedImages = [];
    
    // Process uploaded files from express-fileupload
    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      console.log('📁 Found uploaded files:', files.length);
      
      for (const file of files) {
        if (file.size > 0) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
          const uploadPath = path.join(__dirname, '../public/uploads', fileName);
          
          await file.mv(uploadPath);
          uploadedImages.push(`/uploads/${fileName}`);
          console.log('📁 Saved file:', fileName);
        }
      }
    }
    
    // Process image URLs from form data
    if (req.body.imageUrls) {
      try {
        const imageUrls = JSON.parse(req.body.imageUrls);
        if (Array.isArray(imageUrls)) {
          console.log('📁 Processing image URLs:', imageUrls);
          uploadedImages.push(...imageUrls);
        }
      } catch (error) {
        console.log('⚠️ Invalid imageUrls JSON:', error.message);
      }
    }
    
    // Set default image if no images provided
    if (uploadedImages.length === 0) {
      console.log('⚠️ No images provided, using placeholder');
      uploadedImages.push('https://picsum.photos/400/300');
    }

    // Generate SKU
    const sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Process color stock data
    let colorStock = null;
    if (req.body.colorStock && typeof req.body.colorStock === 'string') {
      try {
        colorStock = JSON.parse(req.body.colorStock);
      } catch (error) {
        console.log('⚠️ Invalid color stock JSON, using null');
        colorStock = null;
      }
    } else if (req.body.colorStock) {
      colorStock = req.body.colorStock;
    }

    // Insert product into database
    const [result] = await pool.execute(
      `INSERT INTO products (
        name, description, price, original_price, category, brand, stock, 
        sku, weight, length, height, size, color, color_stock, images, tags, is_active, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.name.trim(),
        req.body.description.trim(),
        parseFloat(req.body.price) || 0,
        req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
        req.body.category || 'Others',
        req.body.brand || '',
        parseInt(req.body.stock) || 0,
        sku,
        req.body.weight ? parseFloat(req.body.weight) : null,
        req.body.length ? parseFloat(req.body.length) : null,
        req.body.height ? parseFloat(req.body.height) : null,
        req.body.size || '',
        req.body.color || '',
        colorStock ? JSON.stringify(colorStock) : null,
        JSON.stringify(uploadedImages),
        req.body.tags ? JSON.stringify(req.body.tags) : JSON.stringify([]),
        true,
        req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : false
      ]
    );

    // Get the created product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    const product = products[0];
    product.images = JSON.parse(product.images);
    product.tags = JSON.parse(product.tags);
    if (product.color_stock) {
      try {
        product.color_stock = JSON.parse(product.color_stock);
      } catch (error) {
        console.log('⚠️ Invalid color_stock JSON, using null');
        product.color_stock = null;
      }
    }

    console.log('✅ Product created successfully:', {
      id: product.id,
      name: product.name,
      images: product.images
    });

    res.status(201).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during product creation'
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
router.put('/:id', handleFileUpload, handleUploadError, async (req, res) => {
  try {
    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Update product
    const updateFields = [];
    const updateValues = [];

    if (req.body.name) {
      updateFields.push('name = ?');
      updateValues.push(req.body.name.trim());
    }
    if (req.body.description) {
      updateFields.push('description = ?');
      updateValues.push(req.body.description.trim());
    }
    if (req.body.price) {
      updateFields.push('price = ?');
      updateValues.push(parseFloat(req.body.price));
    }
    if (req.body.category) {
      updateFields.push('category = ?');
      updateValues.push(req.body.category);
    }
    if (req.body.stock !== undefined) {
      console.log(`📦 Backend received stock value: ${req.body.stock} (type: ${typeof req.body.stock})`);
      updateFields.push('stock = ?');
      updateValues.push(parseInt(req.body.stock));
    }
    if (req.body.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(Boolean(req.body.is_active));
    }
    if (req.body.is_featured !== undefined) {
      updateFields.push('is_featured = ?');
      updateValues.push(Boolean(req.body.is_featured));
    }
    if (req.body.length !== undefined) {
      updateFields.push('length = ?');
      updateValues.push(req.body.length ? parseFloat(req.body.length) : null);
    }
    if (req.body.height !== undefined) {
      updateFields.push('height = ?');
      updateValues.push(req.body.height ? parseFloat(req.body.height) : null);
    }
    if (req.body.size !== undefined) {
      updateFields.push('size = ?');
      updateValues.push(req.body.size || null);
    }
    if (req.body.color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(req.body.color || null);
    }
    if (req.body.colorStock !== undefined) {
      let colorStock = null;
      if (req.body.colorStock && typeof req.body.colorStock === 'string') {
        try {
          colorStock = JSON.parse(req.body.colorStock);
        } catch (error) {
          console.log('⚠️ Invalid color stock JSON, using null');
          colorStock = null;
        }
      } else if (req.body.colorStock) {
        colorStock = req.body.colorStock;
      }
      updateFields.push('color_stock = ?');
      updateValues.push(colorStock ? JSON.stringify(colorStock) : null);
    }

    // Handle image updates - check for clearImages flag
    if (req.body.clearImages === 'true') {
      console.log('📁 Clearing all images for product');
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify([]));
    } else if (req.body.uploadedImages || req.body.image || req.body.images || req.body.imageUrls) {
      const uploadedImages = [];
      
      // Process uploaded files from express-fileupload
      if (req.body.uploadedImages && req.body.uploadedImages.length > 0) {
        uploadedImages.push(...req.body.uploadedImages);
      }
      
      // Process image URLs from form data
      if (req.body.image && req.body.image.trim()) {
        uploadedImages.push(req.body.image.trim());
      } else if (req.body.images && Array.isArray(req.body.images)) {
        uploadedImages.push(...req.body.images);
      }
      
      // Process imageUrls from form data
      if (req.body.imageUrls) {
        try {
          const imageUrls = JSON.parse(req.body.imageUrls);
          if (Array.isArray(imageUrls)) {
            uploadedImages.push(...imageUrls);
          }
        } catch (error) {
          console.log('⚠️ Invalid imageUrls JSON:', error.message);
        }
      }
      
      // Only update if we have new images
      if (uploadedImages.length > 0) {
        updateFields.push('images = ?');
        updateValues.push(JSON.stringify(uploadedImages));
        console.log('📁 Updating product images:', uploadedImages);
      } else {
        console.log('📁 No new images provided, keeping current images');
      }
    } else {
      console.log('📁 No image fields provided, keeping current images');
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }

    updateValues.push(req.params.id);

    await pool.execute(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    const product = products[0];
    product.images = JSON.parse(product.images);
    product.tags = JSON.parse(product.tags);
    if (product.color_stock) {
      try {
        product.color_stock = JSON.parse(product.color_stock);
      } catch (error) {
        console.log('⚠️ Invalid color_stock JSON for product', product.id);
        product.color_stock = null;
      }
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during product update'
    });
  }
});

// @desc    Update product stock after order
// @route   PUT /api/products/:id/stock
// @access  Public
router.put('/:id/stock', async (req, res) => {
  try {
    console.log('🔄 Stock update request received:', {
      productId: req.params.id,
      body: req.body,
      method: req.method,
      url: req.url
    });
    
    const { quantity, color } = req.body;
    
    if (!quantity || quantity <= 0) {
      console.log('❌ Invalid quantity:', quantity);
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity is required'
      });
    }

    // Get current product
    const productId = parseInt(req.params.id);
    console.log('🔍 Looking for product with ID:', productId, 'Type:', typeof productId);
    
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    console.log('📋 Found products:', products.length);

    if (products.length === 0) {
      console.log('❌ Product not found with ID:', req.params.id);
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const product = products[0];
    console.log('📦 Current product:', {
      id: product.id,
      name: product.name,
      stock: product.stock,
      color_stock: product.color_stock
    });
    
    let colorStock = null;
    
    // Parse existing color stock
    if (product.color_stock) {
      try {
        colorStock = JSON.parse(product.color_stock);
        console.log('🎨 Parsed color stock:', colorStock);
      } catch (error) {
        console.log('⚠️ Invalid color_stock JSON, using null');
        colorStock = {};
      }
    }

    // Update stock based on whether product has colors
    if (color && colorStock && colorStock[color] !== undefined) {
      // Update color-specific stock
      const currentColorStock = colorStock[color] || 0;
      const newColorStock = Math.max(0, currentColorStock - quantity);
      colorStock[color] = newColorStock;
      
      console.log(`🎨 Updating ${color} stock: ${currentColorStock} → ${newColorStock}`);
      
      await pool.execute(
        'UPDATE products SET color_stock = ? WHERE id = ?',
        [JSON.stringify(colorStock), req.params.id]
      );
      
      // Calculate total stock after update
      const totalStock = Object.values(colorStock).reduce((sum, stock) => sum + parseInt(stock), 0);
      console.log(`📊 Total stock after update: ${totalStock}`);
      
      console.log(`✅ Updated ${color} stock: ${currentColorStock} → ${newColorStock} (Product: ${product.name})`);
      
      res.status(200).json({
        status: 'success',
        message: 'Stock updated successfully',
        data: {
          productId: req.params.id,
          color: color,
          oldStock: currentColorStock,
          newStock: newColorStock,
          totalStock: totalStock,
          soldOut: totalStock === 0
        }
      });
    } else {
      // Update general stock
      const currentStock = product.stock || 0;
      const newStock = Math.max(0, currentStock - quantity);
      
      console.log(`📦 Updating general stock: ${currentStock} → ${newStock}`);
      
      await pool.execute(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, req.params.id]
      );
      
      console.log(`✅ Updated general stock: ${currentStock} → ${newStock} (Product: ${product.name})`);
      
      res.status(200).json({
        status: 'success',
        message: 'Stock updated successfully',
        data: {
          productId: req.params.id,
          oldStock: currentStock,
          newStock: newStock,
          totalStock: newStock,
          soldOut: newStock === 0
        }
      });
    }
  } catch (error) {
    console.error('❌ Update stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during stock update'
    });
  }
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Public
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity, color } = req.body;
    const productId = req.params.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity is required'
      });
    }

    // Get current product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const product = products[0];
    let colorStock = null;

    // Parse existing color stock
    if (product.color_stock) {
      try {
        colorStock = JSON.parse(product.color_stock);
      } catch (error) {
        console.log('⚠️ Invalid color_stock JSON for product', productId);
        colorStock = {};
      }
    }

    // Update stock based on color or general stock
    if (color && colorStock) {
      // Update specific color stock
      if (colorStock[color] !== undefined) {
        colorStock[color] = Math.max(0, colorStock[color] - quantity);
      }
      
      // Update the product with new color stock
      await pool.execute(
        'UPDATE products SET color_stock = ? WHERE id = ?',
        [JSON.stringify(colorStock), productId]
      );
    } else {
      // Update general stock
      const newStock = Math.max(0, (product.stock || 0) - quantity);
      await pool.execute(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, productId]
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Stock updated successfully',
      data: {
        productId,
        quantity,
        color,
        updatedStock: color ? colorStock?.[color] : product.stock - quantity
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating stock'
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public (temporarily for testing)
router.delete('/:id', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during product deletion'
    });
  }
});

// @desc    Delete all products (Bulk delete)
// @route   DELETE /api/products
// @access  Public (temporarily for testing)
router.delete('/', async (req, res) => {
  try {
    // Get count of products before deletion
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM products'
    );
    const totalProducts = countResult[0].total;

    if (totalProducts === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No products found to delete'
      });
    }

    // Delete all products
    await pool.execute('DELETE FROM products');

    res.status(200).json({
      status: 'success',
      message: `All ${totalProducts} products deleted successfully`,
      deletedCount: totalProducts
    });
  } catch (error) {
    console.error('Bulk delete products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during bulk product deletion'
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT * FROM products 
       WHERE is_featured = TRUE AND is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 8`
    );

    // Parse JSON fields
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : []
    }));

    res.status(200).json({
      status: 'success',
      count: formattedProducts.length,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router; 