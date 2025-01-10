const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  userId: { type: String, required: true },
  categoryLimits: { type: Number },
  purpose: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  time: { type: String, default: () => new Date().toLocaleTimeString() },
});

const limitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  monthlyLimit: { type: Number, required: true },
});

module.exports = {
  Expense: mongoose.model("Expense", expenseSchema),
  Limit: mongoose.model("Limit", limitSchema),
};
