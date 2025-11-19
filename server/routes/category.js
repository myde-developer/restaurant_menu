
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { verifyToken } = require("../middleware/auth");

// GET all categories
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET /api/category error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ADD category
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Category name required" });
    }

    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("POST /api/category error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE category
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM menu_items WHERE category_id = $1", [id]);

    await pool.query("DELETE FROM categories WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/category error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;