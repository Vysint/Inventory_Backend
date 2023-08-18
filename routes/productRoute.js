const router = require("express").Router();

const protect = require("../middlewares/authMiddleware");
const { upload } = require("../utils/upload");
const {
  createProduct,
  getProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");

router.post("/", protect, upload.single("image"), createProduct);

router.patch("/:id", protect, upload.single("image"), updateProduct);

router.get("/", protect, getProducts);

router.get("/:id", protect, getSingleProduct);

router.delete("/:id", protect, deleteProduct);

module.exports = router;
