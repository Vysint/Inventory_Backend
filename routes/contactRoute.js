const router = require("express").Router();
const { contactUs } = require("../controllers/contactCoontroller");
const protect = require("../middlewares/authMiddleware");

router.post("/", protect, contactUs);

module.exports = router;
