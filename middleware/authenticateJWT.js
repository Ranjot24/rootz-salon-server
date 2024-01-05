// middleware/authenticateJWT.js
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");
  console.log("Received Token:", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    { ignoreExpiration: true },
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(403).json({ message: "Forbidden: Invalid token" });
      }

      console.log("Decoded User:", user);
      console.log("Received Token Payload:", user);
      req.user = user;
      next();
    }
  );
};

module.exports = authenticateJWT;
