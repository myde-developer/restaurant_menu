const express = require("express");
const pool = require("../config/database");
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { customer_name, rating, comment, menu_item_id } = req.body;
    
    if (!customer_name || !rating || !comment || !menu_item_id) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required: customer_name, rating, comment, menu_item_id" 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating must be between 1 and 5" 
      });
    }
    
    const menuItemCheck = await pool.query(
      "SELECT id FROM menu_items WHERE id = $1",
      [menu_item_id]
    );
    
    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Menu item not found" 
      });
    }

    const result = await pool.query(
      `INSERT INTO feedbacks (customer_name, rating, comment, menu_item_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customer_name, rating, comment, menu_item_id]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { 
    console.error("Create feedback error:", error);
    next(error); 
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { menu_item_id } = req.query;
    
    let query = `
      SELECT 
        f.*,
        m.name as menu_item_name,
        m.image_url as menu_item_image
      FROM feedbacks f
      LEFT JOIN menu_items m ON f.menu_item_id = m.id
    `;
    
    let queryParams = [];
    
    if (menu_item_id) {
      query += ` WHERE f.menu_item_id = $1`;
      queryParams.push(menu_item_id);
    }
    
    query += ` ORDER BY f.created_at DESC`;
    
    const result = await pool.query(query, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) { 
    console.error("Get feedbacks error:", error);
    next(error); 
  }
});

module.exports = router;