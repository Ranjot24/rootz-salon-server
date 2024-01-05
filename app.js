// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const userRoutes = require("./routes/user");
const appointmentRoutes = require("./routes/appointment");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: "true",
  useUnifiedTopology: "true",
});

mongoose.connection.on("error", (err) => {
  console.log("err", err);
});
mongoose.connection.on("connected", (err, res) => {
  console.log("Database is connected");
});

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });

    req.user = user;
    next();
  });
};

// Use separate route files
app.use("/api/user", userRoutes);
app.use("/api/appointment", authenticateJWT, appointmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
