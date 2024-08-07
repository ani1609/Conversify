const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const uploadProfilePic = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  const user = await User.findById(decoded.id);
  user.profilePic = req.file.path;
  await user.save();
  res.status(201).json({ user });
};

const deleteProfilePic = async (req, res) => {
  const user = req.user;
  const filePath = user.profilePic;
  fs.unlink(filePath, (error) => {
    if (error) {
      console.error("Error deleting file:", error);
    } else {
      console.log("File deleted successfully.");
    }
  });
  user.profilePic = "";
  await user.save();
  res.status(201).json({ user });
};

const addNewProfilePic = async (req, res) => {
  const user = req.user;
  const filePath = user.profilePic;
  fs.unlink(filePath, (error) => {
    if (error) {
      console.error("Error deleting file:", error);
    } else {
      console.log("File deleted successfully.");
    }
  });
  user.profilePic = req.file.path;
  await user.save();
  res.status(201).json({ user });
};

module.exports = {
  uploadProfilePic,
  deleteProfilePic,
  addNewProfilePic,
};
