const express = require("express");
const router = express.Router();
const sequelize = require("../config/database");

router.head("/healthz", (req, res) => {
  return res.status(405).send();
});

const noPayloadAllowed = (req, res, next) => {
  if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
    return res.status(400).send();
  }
  next();
};

router.get("/healthz", noPayloadAllowed, async (req, res) => {
  try {
    await sequelize.authenticate();
    res.set("Cache-Control", "no-cache");
    return res.status(200).send();
  } catch (error) {
    return res.status(503).send();
  }
});

router.all("/healthz", (req, res) => {
  return res.status(405).send();
});

module.exports = router;
