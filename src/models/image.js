const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Image = sequelize.define(
  "Image",
  {
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
      readOnly: true,
    },
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      readOnly: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      readOnly: true,
    },
    upload_date: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      readOnly: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      readOnly: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Image;
