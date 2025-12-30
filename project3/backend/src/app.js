const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/expenses", require("./routes/expenseRoutes"));

module.exports = app;
