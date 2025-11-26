
const express = require("express");
const pool = require("../config/database");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

// ============= POST ORDER =============
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    const {
      customer_name,
      customer_phone,
      delivery_address,
      note = "",
      total_price,
      items
    } = req.body;

    if (!customer_name || !customer_phone || !delivery_address || !items || !total_price) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let itemsArray;
    try {
      itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (parseError) {
      return res.status(400).json({ success: false, message: "Invalid items format" });
    }

    if (!Array.isArray(itemsArray)) {
      return res.status(400).json({ success: false, message: "Items must be an array" });
    }

    // Insert order
    const orderQuery = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, delivery_address, note, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customer_name, customer_phone, delivery_address, note, total_price]
    );

    const orderId = orderQuery.rows[0].id;

    // Insert items
    for (const item of itemsArray) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, item_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          item.id,
          item.quantity,
          item.price,
          item.name
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Order placed!", order: orderQuery.rows[0] });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  } finally {
    client.release();
  }
});

// ============= GET ALL ORDERS (Admin only) =============
router.get("/", verifyToken, async (req, res, next) => { 
  try {
    const result = await pool.query(`
      SELECT o.*, 
             json_agg(json_build_object('name', oi.item_name, 'quantity', oi.quantity, 'price', oi.price)) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
});

module.exports = router;