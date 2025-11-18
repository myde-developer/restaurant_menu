const express = require("express");
const pool = require("../config/database");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;