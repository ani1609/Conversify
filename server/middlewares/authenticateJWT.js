const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { SECRET_KEY } = process.env;

function authenticateJWT(req, res, next) {
  const authorizationHeader = req.header("Authorization");

  if (!authorizationHeader) {
    return res
      .status(401)
      .json({ message: "Authentication failed: No token provided." });
  }

  const token = authorizationHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log(err);
      return res
        .status(403)
        .json({ message: "Authentication failed: Invalid token." });
    }
    User.findOne({ _id: decoded.id })
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((error) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
  });
}

module.exports = authenticateJWT;
