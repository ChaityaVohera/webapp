const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { PublishCommand, SNSClient } = require("@aws-sdk/client-sns"); // Import PublishCommand and SNSClient
const { v4: uuidv4 } = require("uuid");
const User = require("../models/user");
const Image = require("../models/image");
const logger = require("../config/logger");
const StatsD = require("node-statsd");
const s3 = new S3Client({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION }); // Initialize SNS client
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const statsdClient = new StatsD();
const { Op } = require("sequelize");
const crypto = require("crypto");
const EmailsSent = require("../models/emails_sent");

// Create a new user
exports.createUser = async (req, res) => {
  const startTime = Date.now();
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password || !first_name || !last_name) {
    logger.warn("User creation failed: missing fields");
    return res.status(400).send({ error: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.info(`User creation failed: email ${email} already exists`);
      return res.status(400).send();
    }

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // Token expires in 2 minutes

    const newUser = await User.create({
      email,
      password,
      first_name,
      last_name,
      verification_token: verificationToken,
      verification_token_expiry: verificationTokenExpiry,
    });

    const user_id = newUser.id;
    const user_email = newUser.email;

    // Dynamically determine baseURL and verification path from the request
    // const baseURL = `${req.protocol}://${req.get("host")}`; // Dynamic base URL
    const verificationPath = "/v1/user/self/verify"; // Dynamically configurable path
    const baseURL = `${
      req.headers["x-forwarded-proto"] || req.protocol
    }://${req.get("host")}`;

    // Publish message to SNS
    if (process.env.SNS_TOPIC_ARN) {
      const snsMessage = {
        email: user_email,
        user_id: user_id,
        verificationToken: verificationToken,
        baseURL: baseURL, // Include dynamically determined baseURL
        verificationPath: verificationPath, // Include the path separately
      };

      const params = {
        Message: JSON.stringify(snsMessage),
        TopicArn: process.env.SNS_TOPIC_ARN,
      };

      try {
        await sns.send(new PublishCommand(params));
        logger.info(`SNS message published for user ${user_email}`);
        statsdClient.increment("user.post.sns");

        // Log email into database
        await EmailsSent.create({
          email: user_email,
          verification_token: verificationToken,
          status: "SNS_PUBLISHED",
        });
        logger.info(
          `Email record inserted into database for user: ${user_email}`
        );
      } catch (snsError) {
        logger.error("Error publishing to SNS", snsError);

        // Log failed SNS publish into database
        await EmailsSent.create({
          email: user_email,
          verification_token: verificationToken,
          status: "SNS_FAILED",
        });
        logger.info(
          `Email failure record inserted into database for user: ${user_email}`
        );
      }
    } else {
      logger.warn("SNS_TOPIC_ARN not defined in environment variables");
    }

    const duration = Date.now() - startTime;
    statsdClient.increment("api.createUser.count");
    statsdClient.timing("api.createUser.duration", duration);

    logger.info(`User created successfully: ${newUser.email}`);
    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      account_created: newUser.account_created,
      account_updated: newUser.account_updated,
    });
  } catch (error) {
    logger.error("Error creating user:", error);
    return res.status(500).send();
  }
};

exports.verifyUser = async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    logger.warn("Verification failed: Missing token or email");
    return res
      .status(400)
      .json({ error: "Verification token and email are required" });
  }

  try {
    logger.info(
      `Received verification request for token: ${token} and email: ${email}`
    );
    const user = await User.findOne({
      where: {
        email: email,
        verification_token: token,
        verification_token_expiry: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      logger.warn(
        `Verification failed: Invalid or expired token for email: ${email}`
      );
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expiry = null;
    await user.save();

    logger.info(`User ${email} verified successfully`);

    // Update email status in database
    await EmailsSent.update(
      { status: "VERIFIED" },
      { where: { email: email, verification_token: token } }
    );

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    logger.error(
      `Error during verification for token ${token} and email ${email}: ${error.message}`
    );

    logger.error("Error during verification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update user information
exports.updateUser = async (req, res) => {
  const startTime = Date.now();
  const { first_name, last_name, password, email } = req.body;

  if (email) {
    logger.warn("Attempted email update, which is not allowed");
    return res.status(400).send();
  }

  if (!first_name && !last_name && !password) {
    logger.warn("Update request failed: no fields to update provided");
    return res.status(400).send();
  }

  try {
    const user = await User.findOne({ where: { email: req.authUser.email } });
    if (!user) {
      logger.warn("User not found for update");
      return res.status(404).send();
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (password) user.password = password;

    await user.save();

    const duration = Date.now() - startTime;
    statsdClient.increment("api.updateUser.count");
    statsdClient.timing("api.updateUser.duration", duration);

    logger.info(`User updated successfully: ${user.email}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("Error updating user:", error);
    return res.status(500).send();
  }
};

// Get user information
exports.getUserInfo = async (req, res) => {
  const startTime = Date.now();
  try {
    const user = await User.findOne({ where: { email: req.authUser.email } });
    if (!user) {
      logger.warn("User information request failed: user not found");
      return res.status(404).send();
    }

    const duration = Date.now() - startTime;
    statsdClient.increment("api.getUserInfo.count");
    statsdClient.timing("api.getUserInfo.duration", duration);

    logger.info(`User information retrieved: ${user.email}`);
    return res.status(200).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    logger.error("Error retrieving user information:", error);
    return res.status(500).send();
  }
};

// Upload Profile Picture
exports.uploadProfilePic = async (req, res) => {
  const startTime = Date.now();
  if (!req.file) {
    logger.warn("Profile picture upload failed: no file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Allowed MIME types for images
  const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"];

  // Check if the uploaded file has an allowed MIME type
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    logger.warn("Profile picture upload failed: unsupported file type");
    return res.status(400).json({
      error: "Unsupported file type. Only PNG, JPG, and JPEG are allowed.",
    });
  }

  const userId = req.authUser.id;

  try {
    const existingImage = await Image.findOne({ where: { user_id: userId } });
    if (existingImage) {
      logger.info("Profile picture upload failed: picture already exists");
      return res.status(400).json({ error: "Profile picture already exists" });
    }

    const imageId = uuidv4();
    const key = `profile-pics/${userId}-${imageId}`;

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        file_name: req.file.originalname,
        user_id: userId,
      },
    };

    await s3.send(new PutObjectCommand(params));
    const imageRecord = await Image.create({
      file_name: req.file.originalname,
      id: imageId,
      url: `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      user_id: userId,
    });

    const duration = Date.now() - startTime;
    statsdClient.increment("api.uploadProfilePic.count");
    statsdClient.timing("api.uploadProfilePic.duration", duration);

    logger.info("Profile picture uploaded successfully");
    res.status(201).json({
      file_name: imageRecord.file_name,
      id: imageRecord.id,
      url: imageRecord.url,
      upload_date: imageRecord.upload_date,
      user_id: imageRecord.user_id,
    });
  } catch (error) {
    logger.error("Error uploading to S3:", error);
    console.error("Full error details:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

// Get Profile Picture
exports.getProfilePic = async (req, res) => {
  const startTime = Date.now();
  try {
    const imageRecord = await Image.findOne({
      where: { user_id: req.authUser.id },
    });

    if (!imageRecord) {
      logger.warn("Profile picture retrieval failed: not found");
      return res.status(404).json({ error: "Profile picture not found" });
    }

    const duration = Date.now() - startTime;
    statsdClient.increment("api.getProfilePic.count");
    statsdClient.timing("api.getProfilePic.duration", duration);

    logger.info("Profile picture retrieved successfully");
    res.status(200).json({
      file_name: imageRecord.file_name,
      id: imageRecord.id,
      url: imageRecord.url,
      upload_date: imageRecord.upload_date,
      user_id: imageRecord.user_id,
    });
  } catch (error) {
    logger.error("Error retrieving profile picture:", error);
    res.status(500).json({ error: "Failed to retrieve profile picture" });
  }
};

// Delete Profile Picture
exports.deleteProfilePic = async (req, res) => {
  const startTime = Date.now();
  const userId = req.authUser.id;

  try {
    const imageRecord = await Image.findOne({ where: { user_id: userId } });

    if (!imageRecord) {
      logger.warn("Profile picture deletion failed: not found");
      return res.status(404).json({ error: "Profile picture not found" });
    }

    const key = `profile-pics/${userId}-${imageRecord.id}`;
    await s3.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key })
    );
    await Image.destroy({ where: { id: imageRecord.id } });

    const duration = Date.now() - startTime;
    statsdClient.increment("api.deleteProfilePic.count");
    statsdClient.timing("api.deleteProfilePic.duration", duration);

    logger.info("Profile picture deleted successfully");
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting profile picture:", error);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
};
