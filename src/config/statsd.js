const { StatsD } = require("node-statsd");
const statsdClient = new StatsD({
  host: process.env.STATSD_HOST || "localhost",
  port: process.env.STATSD_PORT || 8125,
});

module.exports = statsdClient;
