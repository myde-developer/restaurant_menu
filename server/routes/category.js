const express = require("express");
const pool = require("../config/database");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    console.log("Incoming Category", req.body);
    const result = await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING *", [name]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;