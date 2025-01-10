const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const { Limit, Expense } = require("./Model/expense.model");
require("dotenv").config();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Hello word");
});
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log("server is running");
    });
  } catch (err) {
    console.log(err);
  }
}

app.post("/expenses", async (req, res) => {
  console.log(req.body);
  try {
    const result = await Expense.create(req.body);
    return result;
  } catch (error) {
    res.status(500).json({ message: "Error adding expense", error });
  }
});
// Get all expenses
app.get("/expenses/:id", async (req, res) => {
  const UserId = req.params.id;
  try {
    const result = await Expense.findOne({ userId: UserId });
    return result;
  } catch (error) {
    res.status(500).json({ message: "Error adding expense", error });
  }
});
app.post("/monthlyLimit", async (req, res) => {
  try {
    const result = await Limit.create(req.body);
    res.status(201).json(result); // Send the result as a JSON response
  } catch (error) {
    res.status(500).json({ message: "Error adding expense", error });
  }
});
app.get("/expenses/summary/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const expenses = await Expense.aggregate([
      { $match: { userId } }, // Filter by userId
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            category: "$category",
          },
          totalAmount: { $sum: "$amount" }, // Sum amounts for the same category
          purposes: { $push: "$purpose" }, // Collect purposes for the category
        },
      },
      {
        $group: {
          _id: "$_id.date", // Group by date
          categories: {
            $push: {
              category: "$_id.category",
              totalAmount: "$totalAmount",
              purposes: "$purposes", // Include purposes in the output
            },
          },
          dailyTotal: { $sum: "$totalAmount" }, // Sum total amounts for all categories
        },
      },
      { $sort: { _id: -1 } }, // Sort by date descending
    ]);

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});
app.patch("/expenses", async (req, res) => {
  const { userId, date, category, newAmount } = req.body;

  // Convert the date to a standardized format (only date, no time)
  const dateObject = new Date(date);
  dateObject.setHours(0, 0, 0, 0); // Normalize time to 00:00:00

  try {
    const expense = await Expense.findOne({
      userId,
      category,
      date: {
        $gte: dateObject, // Greater than or equal to the normalized date
        $lt: new Date(dateObject.getTime() + 24 * 60 * 60 * 1000), // Less than the next day
      },
    });

    if (expense) {
      expense.amount = newAmount;
      expense.markModified("amount");
      await expense.save();
      res.status(200).json({ message: "Expense updated successfully!" });
    } else {
      res.status(404).json({ message: "Expense record not found!" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense." });
  }
});

main();
