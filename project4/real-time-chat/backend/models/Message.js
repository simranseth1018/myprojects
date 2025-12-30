const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: String,
    receiver: String,
    roomId: String,
    text: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
