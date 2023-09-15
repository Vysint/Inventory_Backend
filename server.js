const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRoutes = require("./routes/userRoute");
const productRoutes = require("./routes/productRoute.js");
const contactRoutes = require("./routes/contactRoute");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://vysint-inventory-2098b.web.app"
    ],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact_us", contactRoutes);
// Error middlewares
app.use(errorHandler);
app.use(notFound);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connect to mongoDB!");
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
};

app.listen(PORT, () => {
  console.log(`Server Listening at ${PORT}`);
  connect();
});
