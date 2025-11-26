const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(255),
        is_available BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        delivery_address TEXT NOT NULL,
        note TEXT,
        total_price DECIMAL(10,2) NOT NULL,  
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INT REFERENCES menu_items(id),
        item_name VARCHAR(150) NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        price DECIMAL(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database initialized");
    console.log("Tables: categories, menu_items, orders, order_items, feedbacks");
  } catch (error) {
    console.error("Error initializing database:", error.message);
  }
};

initDB();

module.exports = pool;