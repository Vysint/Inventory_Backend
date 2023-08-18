const router = require("express").Router();

const {
  register,
  login,
  logout,
  getUser,
  loginStatus,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

const protect = require("../middlewares/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.get("/logout", logout);

router.get("/profile", protect, getUser);

router.get("/loggedin", loginStatus);

router.patch("/updateuser", protect, updateUserProfile);

router.patch("/changepassword", protect, changePassword);

router.post("/forgotpassword", forgotPassword);

router.put("/resetpassword/:resetToken", resetPassword);

module.exports = router;
