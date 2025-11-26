
const express = require("express");
const pool = require("../config/database");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

// GET all menu items
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT mi.*, c.name AS category_name 
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      ORDER BY c.name, mi.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT mi.*, c.name AS category_name 
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Menu item not found" });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { 
    console.error('Get menu item error:', error);
    next(error); 
  }
});

// POST new menu item
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { category_id, name, description, price, image_url, is_available = true } = req.body;
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, name, description || null, price, image_url || null, is_available]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

// UPDATE menu item
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, category_id, is_available } = req.body;
    await pool.query(
      `UPDATE menu_items SET name=$1, description=$2, price=$3, image_url=$4, category_id=$5, is_available=$6 WHERE id=$7`,
      [name, description || null, price, image_url || null, category_id, is_available, id]
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// DELETE menu item
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;