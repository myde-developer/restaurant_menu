
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
        menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database tables created successfully");

    // Add menu_item_id column if it doesn't exist
    try {
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='feedbacks' AND column_name='menu_item_id'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log("🔄 Adding menu_item_id column to feedbacks table...");
        await pool.query(`
          ALTER TABLE feedbacks 
          ADD COLUMN menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL
        `);
        console.log("menu_item_id column added successfully");
      } else {
        console.log("menu_item_id column already exists");
      }
    } catch (columnError) {
      console.log("Could not add menu_item_id column:", columnError.message);
    }

    // Check if we have any menu items
    const menuItemsCheck = await pool.query("SELECT id FROM menu_items LIMIT 1");
    
    if (menuItemsCheck.rows.length > 0) {
      // We have menu items, update existing feedbacks to use the first menu item
      const firstMenuItemId = menuItemsCheck.rows[0].id;
      console.log(`Setting menu_item_id = ${firstMenuItemId} for existing feedbacks...`);
      
      try {
        await pool.query(`
          UPDATE feedbacks 
          SET menu_item_id = $1 
          WHERE menu_item_id IS NULL
        `, [firstMenuItemId]);
        console.log("Existing feedbacks updated with menu_item_id");
      } catch (updateError) {
        console.log(" Could not update existing feedbacks:", updateError.message);
      }
    } else {
      console.log(" No menu items found, skipping feedbacks update");
    }

    console.log(" Database initialization completed");
    
  } catch (error) {
    console.error(" Error initializing database:", error.message);
  }
};

initDB();

module.exports = pool;