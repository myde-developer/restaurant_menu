const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();

router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if(username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD){
        const token = jwt.sign({ username, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});

module.exports = router;