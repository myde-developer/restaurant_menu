const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// PUBLIC ROUTES
app.use("/api/menu", require("./routes/menu"));
app.use("/api/feedbacks", require("./routes/feedback"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/category", require("./routes/category"))

// ADMIN ROUTES
const { verifyToken } = require("./middleware/auth"); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});