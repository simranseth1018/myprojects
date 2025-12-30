const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  type: {
    type: String,
    enum: ["income", "expense"],
  },
  category: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Expense", expenseSchema);
