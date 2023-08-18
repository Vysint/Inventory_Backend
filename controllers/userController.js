const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const verifyToken = require("../utils/jwt");
const Token = require("../models/tokenModel");
const { sendEmail } = require("../utils/sendEmail");
const { response } = require("express");

// @desc   Register a new user
// route   POST /api/users/register
// @access Public
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Validation
  try {
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }
  } catch (err) {
    return next(err);
  }
  // Check Email length
  try {
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must have a minimum of 6 characters");
    }
  } catch (err) {
    return next(err);
  }
  // Check if user email already exists
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(401);
      throw new Error("Email already registered.");
    }
  } catch (err) {
    return next(err);
  }
  // Create a User
  try {
    const newUser = await User.create({
      name,
      email,
      password,
    });
    if (newUser) {
      const { _id, name, email, photo, phone, bio } = newUser;
      verifyToken(res, _id);
      res.status(201).json({ _id, name, email, photo, phone, bio });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (err) {
    return next(err);
  }
};

// @desc   Login a  user
// route   POST /api/users/login
// @access Public

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // Validate request
  try {
    if (!email || !password) {
      res.status(400);
      throw new Error("Please add email and password");
    }
  } catch (err) {
    return next(err);
  }

  // Check if user exists
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400);
      throw new Error("User not found, please register instead.");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Wrong Password");
    }
    verifyToken(res, user._id);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email });
  } catch (err) {
    return next(err);
  }
};

// @desc   Logout user
// route   POST /api/users/logout
// @access Public

exports.logout = async (req, res, next) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ Message: "User logged out successfully" });
};

// @desc   Get user
// route   GET /api/users/getuser
// @access private

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        phone: user.phone,
        bio: user.bio,
      });
    } else {
      res.status(401);
      throw new Error("User not found");
    }
  } catch (err) {
    return next(err);
  }
};

// @desc   Get user Login Status
// route   GET /api/users/loggedin
// @access private

exports.loginStatus = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
};

// @desc   Update User
// route   PATCH /api/users/updateuser
// @access private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.email = user.email;
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.bio = req.body.bio || user.bio;
      user.photo = req.body.photo || user.photo;

      const updateUser = await user.save();

      res.status(200).json({
        _id: updateUser._id,
        name: updateUser.name,
        email: updateUser.email,
        photo: updateUser.photo,
        phone: updateUser.phone,
        bio: updateUser.bio,
      });
    } else {
      res.status(401);
      throw new Error("User not found, please login");
    }
  } catch (err) {
    return next(err);
  }
};

// @desc   Change Password
// route   PATCH /api/users/changepassword
// @access private

exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { oldPassword, password } = req.body;
    if (user) {
      // Validate
      if (!oldPassword || !password) {
        res.status(400);
        throw new Error("Please add old and new Password");
      }

      try {
        // Check if old password matches in DB
        const isPasswordValid = await bcrypt.compare(
          oldPassword,
          user.password
        );
        if (user && isPasswordValid) {
          user.password = password;
          await user.save();
          res.status(200).send("Password change is successful");
        } else {
          res.status(400);
          throw new Error("Old password is incorrect");
        }
      } catch (err) {
        return next(err);
      }
    } else {
      res.status(400);
      throw new Error("User not found, please sign in");
    }
  } catch (err) {
    return next(err);
  }
};

// @desc   Forgot Password
// route   POST /api/users/forgotpassword
// @access public

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      // Delete token if it exists in the database
      try {
        let token = await Token.findOne({ userId: user._id });
        if (token) {
          await token.deleteOne();
        }
      } catch (err) {
        res.status(400);
        throw new Error(err);
      }

      // Create a reset token
      let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

      // Hash token before saving to the database
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Save to the database

      await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000), //30 minutes
      }).save();

      // Construct the Reset Url

      const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

      // Reset Password Email
      const message = `
      <h2>Hello ${user.name}</h2>
      <p>You requested for a password reset</p>   
      <p>Please use the link below to reset your password</p>
      <p>This reset link is valid for only 30 minutes</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

      <p>Regards</p>

      <p>Team</p>
         `;

      //  Email Options

      const subject = "Password Reset Request";
      const send_to = user.email;
      const sent_from = process.env.EMAIL_USER;

      try {
        await sendEmail(subject, message, send_to, sent_from);
        res.status(200).json({ success: true, message: "Reset Email sent" });
      } catch (err) {
        res.status(400);
        throw new Error("Email not sent, please try again");
      }
    } else {
      res.status(400);
      throw new Error("User not found");
    }
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Find the token in the DB
  try {
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });
    if (userToken) {
      // Find user
      const user = await User.findOne({ _id: userToken.userId });
      user.password = password;
      await user.save();

      res
        .status(200)
        .json({ message: "Password reset successful, please login" });
    } else {
      res.status(404);
      throw new Error("Invalid or expired token");
    }
  } catch (err) {
    return next(err);
  }
};
