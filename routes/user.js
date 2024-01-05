const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateJWT = require("../middleware/authenticateJWT");

const User = require("../models/User"); // Import your User model

// Add a route for user registration
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate input data
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the username or email is already taken
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already in use" });
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      hashedPassword,
    });

    // Save the user in the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { username: newUser.username, userId: newUser._id },
      process.env.JWT_SECRET
    );

    res.json({ message: "User registered successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
  console.log("Generated Token:", token);
});

// Add a route for user login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Replace this with your user authentication logic
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username, userId: user._id },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
  console.log("Generated Token:", token);
});

// Route for updating user profile
router.put("/profile", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId; // Extract user ID from JWT payload

    // Fetch the user from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile fields (replace 'updateFields' with actual fields you want to update)
    const updateFields = req.body;
    Object.assign(user, updateFields);

    // Save the updated user profile
    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
