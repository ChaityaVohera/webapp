const sequelize = require("../config/database");
const logger = require("../config/logger");
const StatsD = require("node-statsd");

const statsdClient = new StatsD();

// Health Check Endpoint
const healthCheck = async (req, res) => {
  const startTime = Date.now();

  // Check for unexpected payload
  if (Object.keys(req.body).length > 0) {
    logger.warn("Health check failed: payload provided");
    statsdClient.increment("api.healthCheck.invalidPayload");
    return res.status(400).send();
  }

  try {
    // Test database connection
    await sequelize.authenticate();
    res.set("Cache-Control", "no-cache");

    // Log duration for successful health check
    const duration = Date.now() - startTime;
    statsdClient.increment("api.healthCheck.count");
    statsdClient.timing("api.healthCheck.duration", duration);

    logger.info("Health check passed");
    return res.status(200).send();
  } catch (error) {
    // Log error if health check fails
    logger.error("Health check failed:", error.message);
    statsdClient.increment("api.healthCheck.failureCount");

    res.set("Cache-Control", "no-cache");
    return res.status(503).send();
  }
};

module.exports = { healthCheck };
