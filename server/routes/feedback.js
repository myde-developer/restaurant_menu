
const express = require("express");
const pool = require("../config/database");
const router = express.Router();

// POST 
router.post("/", async (req, res) => {
  try {
    const { customer_name, rating, comment, menu_item_id } = req.body;
    
    console.log("Received feedback data:", { customer_name, rating, comment, menu_item_id });
    
    // Validate required fields
    if (!customer_name || !rating || !comment || !menu_item_id) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required: customer_name, rating, comment, menu_item_id" 
      });
    }
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating must be between 1 and 5" 
      });
    }
    
    // Check if menu item exists
    const menuItemCheck = await pool.query(
      "SELECT id, name FROM menu_items WHERE id = $1",
      [menu_item_id]
    );
    
    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Menu item not found" 
      });
    }

    // Insert the feedback
    const result = await pool.query(
      `INSERT INTO feedbacks (customer_name, rating, comment, menu_item_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customer_name, parseInt(rating), comment, parseInt(menu_item_id)]
    );
    
    console.log("Feedback inserted successfully for menu item:", menu_item_id);
    
    res.status(201).json({ 
      success: true, 
      data: result.rows[0],
      menu_item_name: menuItemCheck.rows[0].name 
    });
    
  } catch (error) { 
    console.error("Create feedback error:", error);
    
    if (error.message.includes("menu_item_id") || error.message.includes("column")) {
      try {
        console.log("Falling back to simple insert without menu_item_id...");
        const { customer_name, rating, comment } = req.body;
        const result = await pool.query(
          `INSERT INTO feedbacks (customer_name, rating, comment) VALUES ($1, $2, $3) RETURNING *`,
          [customer_name, parseInt(rating), comment]
        );
        
        return res.status(201).json({ 
          success: true, 
          data: result.rows[0],
          message: "Review submitted (fallback mode)" 
        });
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Failed to submit review",
      details: error.message 
    });
  }
});

// GET 
router.get("/", async (req, res) => {
  try {
    const { menu_item_id } = req.query;
    
    console.log("Fetching feedbacks with menu_item_id:", menu_item_id);
    
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
      queryParams.push(parseInt(menu_item_id));
    }
    
    query += ` ORDER BY f.created_at DESC`;
    
    console.log("Executing query:", query);
    
    const result = await pool.query(query, queryParams);
    
    console.log("Found feedbacks:", result.rows.length);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length 
    });
    
  } catch (error) { 
    console.error("Get feedbacks error:", error);
    
    if (error.message.includes("menu_item_id") || error.message.includes("column")) {
      try {
        console.log("Falling back to simple query...");
        const result = await pool.query("SELECT * FROM feedbacks ORDER BY created_at DESC");
        return res.json({ 
          success: true, 
          data: result.rows,
          count: result.rows.length 
        });
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Failed to load reviews",
      details: error.message 
    });
  }
});

module.exports = router;