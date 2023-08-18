const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token = req.cookies.jwt;

  try {
    if (token) {
      try {
        // Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Get User from the token
        req.user = await User.findById(decoded.id).select("-password");
        next();
      } catch (err) {
        return next(err);
      }
    } else {
      res.status(401);
      throw new Error("'Not authorized, please login");
    }
  } catch (err) {
    return next(err);
  }
};

module.exports = protect;
