const express = require("express");
const pool = require("../config/database");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT menu_items.*, categories.name AS category_name
      FROM menu_items
      JOIN categories ON menu_items.category_id = categories.id
      ORDER BY categories.name;
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { category_id, name, description, price, image_url } = req.body;
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category_id, name, description, price, image_url]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;