const Expense = require("../models/Expense");

exports.addExpense = async (req, res) => {
  const expense = await Expense.create(req.body);
  res.status(201).json(expense);
};

exports.getExpenses = async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1 });
  res.json(expenses);
};

exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message });
  }
};