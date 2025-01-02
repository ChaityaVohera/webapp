const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EmailsSent = sequelize.define(
  "EmailsSent",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., 'SNS_PUBLISHED', 'SNS_FAILED', 'VERIFIED'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = EmailsSent;
