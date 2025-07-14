const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected for sample data'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample users
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@kazdoura.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567890',
    address: {
      street: '123 Admin St',
      city: 'Admin City',
      state: 'AS',
      zipCode: '12345',
      country: 'USA'
    }
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567891',
    address: {
      street: '456 User Ave',
      city: 'User City',
      state: 'US',
      zipCode: '54321',
      country: 'USA'
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567892',
    address: {
      street: '789 Customer Blvd',
      city: 'Customer Town',
      state: 'CT',
      zipCode: '67890',
      country: 'USA'
    }
  }
];

// Sample products
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 89.99,
    category: 'Electronics',
    brand: 'AudioTech',
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ],
    isFeatured: true,
    isActive: true,
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Noise Cancellation': 'Active',
      'Weight': '250g'
    }
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking watch with heart rate monitor, GPS, and water resistance. Track your workouts and health metrics.',
    price: 199.99,
    category: 'Electronics',
    brand: 'FitTech',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500'
    ],
    isFeatured: true,
    isActive: true,
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery Life': '7 days',
      'Water Resistance': '5ATM',
      'GPS': 'Built-in'
    }
  },
  {
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop with RTX graphics, 16GB RAM, and 512GB SSD. Perfect for gaming and content creation.',
    price: 1299.99,
    category: 'Electronics',
    brand: 'GameTech',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'
    ],
    isFeatured: true,
    isActive: true,
    specifications: {
      'Processor': 'Intel i7-10700H',
      'Graphics': 'RTX 3060',
      'RAM': '16GB DDR4',
      'Storage': '512GB SSD'
    }
  },
  {
    name: 'Designer T-Shirt',
    description: 'Premium cotton t-shirt with unique graphic design. Comfortable fit and high-quality printing that lasts.',
    price: 29.99,
    category: 'Fashion',
    brand: 'StyleCo',
    stock: 100,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'
    ],
    isFeatured: false,
    isActive: true,
    specifications: {
      'Material': '100% Cotton',
      'Fit': 'Regular',
      'Care': 'Machine wash cold',
      'Sizes': 'S, M, L, XL'
    }
  },
  {
    name: 'Wireless Gaming Mouse',
    description: 'Ergonomic wireless gaming mouse with RGB lighting and programmable buttons. Perfect for competitive gaming.',
    price: 79.99,
    category: 'Gaming',
    brand: 'GameTech',
    stock: 75,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500'
    ],
    isFeatured: true,
    isActive: true,
    specifications: {
      'DPI': 'Up to 25,600',
      'Battery Life': '70 hours',
      'Weight': '95g',
      'Connectivity': '2.4GHz Wireless'
    }
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and fitness activities.',
    price: 39.99,
    category: 'Sports',
    brand: 'FitLife',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'
    ],
    isFeatured: false,
    isActive: true,
    specifications: {
      'Material': 'Eco-friendly TPE',
      'Thickness': '6mm',
      'Size': '183cm x 61cm',
      'Weight': '2.5kg'
    }
  },
  {
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe and 12-cup capacity. Brew delicious coffee with ease.',
    price: 89.99,
    category: 'Home & Garden',
    brand: 'HomeBrew',
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500'
    ],
    isFeatured: false,
    isActive: true,
    specifications: {
      'Capacity': '12 cups',
      'Programmable': 'Yes',
      'Thermal Carafe': 'Yes',
      'Auto Shut-off': 'Yes'
    }
  },
  {
    name: 'Wireless Keyboard',
    description: 'Slim wireless keyboard with quiet keys and long battery life. Perfect for office and home use.',
    price: 59.99,
    category: 'Electronics',
    brand: 'TechPro',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'
    ],
    isFeatured: false,
    isActive: true,
    specifications: {
      'Layout': 'Full-size',
      'Battery Life': '2 years',
      'Connectivity': 'Bluetooth 3.0',
      'Backlight': 'No'
    }
  }
];

// Function to create sample data
const createSampleData = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    
    console.log('👥 Creating sample users...');
    
    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }
    
    console.log('📦 Creating sample products...');
    
    // Create products
    for (const productData of sampleProducts) {
      productData.createdBy = createdUsers[0]._id; // Admin user
      const product = await Product.create(productData);
      console.log(`✅ Created product: ${product.name} - $${product.price}`);
    }
    
    console.log('\n🎉 Sample data created successfully!');
    console.log(`📊 Created ${createdUsers.length} users and ${sampleProducts.length} products`);
    console.log('\n🔑 Admin credentials:');
    console.log('   Email: admin@kazdoura.com');
    console.log('   Password: admin123');
    console.log('\n👤 User credentials:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  }
};

// Run the script
createSampleData(); 