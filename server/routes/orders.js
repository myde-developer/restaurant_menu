
const express = require("express");
const pool = require("../config/database");
const router = express.Router();

// ============= POST ORDER =============
router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      customer_name,
      customer_phone,
      delivery_address,
      note = "",
      total_price,
      items: itemsString 
    } = req.body;

    // Convert string back to array
    const items = JSON.parse(itemsString);

    // Insert main order
    const orderQuery = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, delivery_address, note, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customer_name, customer_phone, delivery_address, note, total_price]
    );

    const orderId = orderQuery.rows[0].id;

    // Insert each item
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, item_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.id, item.quantity, item.price, item.name]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Order placed!", order: orderQuery.rows[0] });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Order error:", error);
    next(error);
  } finally {
    client.release();
  }
});

// ============= GET ALL ORDERS (Admin only) =============
router.get("/", async (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;