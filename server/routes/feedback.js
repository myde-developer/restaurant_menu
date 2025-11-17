const express = require("express");
const pool = require("../config/database");
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { customer_name, rating, comment } = req.body;
    const result = await pool.query(
      `INSERT INTO feedbacks (customer_name, rating, comment) VALUES ($1, $2, $3) RETURNING *`,
      [customer_name, rating, comment]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM feedbacks ORDER BY created_at DESC");
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

module.exports = router;