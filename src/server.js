require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const healthcheckRoutes = require("./routes/healthcheckRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.use(healthcheckRoutes);
app.use(userRoutes);

app.use((req, res, next) => {
  if (req.route) {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

if (process.env.NODE_ENV !== "test") {
  sequelize
    .sync({ force: false, alter: true })
    .then(() => {
      console.log("Database synced successfully");
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error("Error syncing database:", err);
    });
}

module.exports = app;
