CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data (will be inserted by backend if missing, but kept here for reference)
INSERT INTO products (name, description, price, category, stock, image_url) VALUES
('🎧 Wireless Headphones', 'Noise cancelling, 30h battery', 99.99, 'Electronics', 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'),
('⌚ Smart Watch', 'Fitness tracking', 199.99, 'Electronics', 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300')
ON CONFLICT DO NOTHING;

INSERT INTO users (name, email) VALUES
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com')
ON CONFLICT DO NOTHING;