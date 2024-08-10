const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { SECRET_KEY, SALT } = process.env;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ message: "invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ message: "invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "7d" });
    res.status(200).json({ token });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const signup = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(409).send({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(Number(SALT));
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = await new User({
      ...req.body,
      password: hashedPassword,
    }).save();

    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, {
      expiresIn: "5d",
    });
    res.status(201).send({ user: newUser, token: token });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const editUserInfo = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contact,
      dob,
      gender,
      profilePic,
      preferredLanguage,
      preferredLocationType,
    } = req.body;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const name = firstName + " " + lastName;
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        name,
        email,
        contact,
        dob,
        gender,
        profilePic,
        preferredLanguage,
        preferredLocationType,
      },
      { new: true }
    );

    if (updatedUser) {
      res.json({
        user: updatedUser,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  const { email, password, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!user || !isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const salt = await bcrypt.genSalt(Number(SALT));
    if (await bcrypt.compare(newPassword, user.password)) {
      return res
        .status(409)
        .json({ error: "New password cannot be the same as old password" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUsers = async (req, res) => {
  try {
    await User.deleteMany({});
    console.log("All users deleted");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  login,
  signup,
  editUserInfo,
  changePassword,
  deleteUsers,
};
