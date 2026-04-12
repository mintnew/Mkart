const express = require('express');
const cors = require('cors');
const pool = require('./db');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Initialize database tables and sample data
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        stock INT DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables ready');

    // Insert sample products if empty
    const prodCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price, category, stock, image_url) VALUES
        ('🎧 Wireless Headphones', 'Noise cancelling, 30h battery', 99.99, 'Electronics', 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'),
        ('⌚ Smart Watch', 'Fitness tracking, heart rate monitor', 199.99, 'Electronics', 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'),
        ('👕 Cotton T-Shirt', '100% organic cotton', 24.99, 'Clothing', 100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300'),
        ('☕ Ceramic Mug', 'Modern design, dishwasher safe', 12.99, 'Home', 200, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300'),
        ('🎒 Backpack', 'Waterproof, 20L capacity', 59.99, 'Accessories', 75, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300'),
        ('💡 Desk Lamp', 'LED, adjustable brightness', 34.99, 'Home', 45, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300');
      `);
      console.log('Sample products inserted');
    }

    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (name, email) VALUES
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com'),
        ('Mike Johnson', 'mike@example.com');
      `);
      console.log('Sample users inserted');
    }
  } catch (err) {
    console.error('DB init error:', err);
  }
};

app.listen(PORT, async () => {
  await initDb();
  console.log(`Backend running on port ${PORT}`);
});