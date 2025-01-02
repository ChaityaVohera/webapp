const auth = require("basic-auth");
const User = require("../models/user");
const bcrypt = require("bcrypt");

module.exports = async (req, res, next) => {
  const credentials = auth(req);

  if (!credentials || !credentials.name || !credentials.pass) {
    return res.status(401).json({ error: "Unauthorized: Missing credentials" });
  }

  try {
    const user = await User.findOne({ where: { email: credentials.name } });

    if (!user || !(await bcrypt.compare(credentials.pass, user.password))) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid credentials" });
    }

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "Account not verified. Please verify your email." });
    }

    req.authUser = user;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};
