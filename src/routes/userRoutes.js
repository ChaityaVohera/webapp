const express = require("express");
const { check } = require("express-validator");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const auth = require("basic-auth");
const multer = require("multer");

const router = express.Router();

// Common API version prefix
const API_VERSION = "/v1"; // Change this to "/v2" for testing or new API versions

// Set up Multer for file uploads
const upload = multer(); // No storage config: multer stores file in memory as Buffer

const noQueryParamsAllowed = (req, res, next) => {
  if (Object.keys(req.query).length > 0 || Object.keys(req.query).length > 0) {
    return res.status(400).send();
  }
  next();
};

const noPayloadAllowed = (req, res, next) => {
  if (Object.keys(req.body).length > 0 || Object.keys(req.query).length > 0) {
    return res.status(400).send();
  }
  next();
};

// Explicitly handle HEAD requests
router.head(`${API_VERSION}/user/self`, (req, res) => {
  return res.status(405).send();
});

// Explicitly handle HEAD request for /v1/user/self/pic to always return 405
router.head("/v1/user/self/pic", (req, res) => {
  return res.status(405).send();
});

router.post(
  `${API_VERSION}/user`,
  noQueryParamsAllowed,
  async (req, res, next) => {
    const credentials = auth(req);
    if (credentials) {
      return res.status(400).send();
    }
    next();
  },
  [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({ min: 6 }).withMessage("Password too short"),
    check("first_name").notEmpty().withMessage("First name is required"),
    check("last_name").notEmpty().withMessage("Last name is required"),
  ],
  validate,
  userController.createUser
);

router.put(
  `${API_VERSION}/user/self`,
  noQueryParamsAllowed,
  authMiddleware,
  [
    check("first_name")
      .optional()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    check("last_name")
      .optional()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    check("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password too short"),
  ],
  validate,
  userController.updateUser
);

router.get(
  `${API_VERSION}/user/self`,
  noQueryParamsAllowed,
  authMiddleware,
  noPayloadAllowed,
  userController.getUserInfo
);

// Profile Picture Routes with Multer for file handling
router.post(
  `${API_VERSION}/user/self/pic`,
  authMiddleware,
  upload.single("file"),
  userController.uploadProfilePic
);

router.get(
  `${API_VERSION}/user/self/pic`,
  authMiddleware,
  userController.getProfilePic
);

router.delete(
  `${API_VERSION}/user/self/pic`,
  authMiddleware,
  userController.deleteProfilePic
);

// Restricting other methods on the profile picture endpoint to return 405
router.all(`${API_VERSION}/user/self/pic`, (req, res) => {
  return res.status(405).send();
});

router.all(`${API_VERSION}/user/self`, (req, res) => {
  return res.status(405).send();
});

router.get(`${API_VERSION}/user/self/verify`, userController.verifyUser);

module.exports = router;
