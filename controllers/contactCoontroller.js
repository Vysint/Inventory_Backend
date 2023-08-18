const User = require("../models/userModel");
const { sendEmail } = require("../utils/sendEmail");

exports.contactUs = async (req, res, next) => {
  const { subject, message } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Validation
      if (!subject || !message) {
        res.status(400);
        throw new Error("Please add subject and message");
      }
      const send_to = process.env.EMAIL_USER;
      const sent_from = process.env.EMAIL_USER;
      const reply_to = user.email;
      try {
        await sendEmail(subject, message, send_to, sent_from, reply_to);
        res.status(200).json({ success: true, message: " Email Sent" });
      } catch (err) {
        res.status(500);
        throw new Error("Email not sent, please try again");
      }
    } else {
      res.status(400);
      throw new Error("User not found, please sign up");
    }
  } catch (err) {
    return next(err);
  }
};
