
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============= PUBLIC ROUTES  =============
app.use("/api/menu", require("./routes/menu"));   
app.use("/api/feedbacks", require("./routes/feedback"));  
app.use("/api/auth", require("./routes/auth"));           
app.use("/api/orders", require("./routes/orders"));  

// ============= PROTECTED ROUTES (Admin only with JWT) =============
const authMiddleware = require("./middleware/auth");

app.use("/api/categories", authMiddleware, require("./routes/category")); 
app.use("/api/orders", authMiddleware, require("./routes/orders")); 

app.use(require("./middleware/index"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});