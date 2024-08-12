const path = require("path");
const ChatRoom = require("../models/chatRoom");
const fs = require("fs");

const uploadProfilePic = async (req, res) => {
  try {
    const user = req.user;
    user.profilePic = req.file.path;

    await user.save();

    res.status(201).json({ path: req.file.path });
  } catch (error) {
    console.error("Error uploading profile pic:", error);
  }
};

const deleteProfilePic = async (req, res) => {
  try {
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

    res.status(201).json({ path: "" });
  } catch (error) {
    console.error("Error deleting profile pic:", error);
  }
};

const addNewProfilePic = async (req, res) => {
  try {
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

    res.status(201).json({ path: req.file.path });
  } catch (error) {
    console.error("Error adding new profile pic:", error);
  }
};

const uploadGroupProfilePic = async (req, res) => {
  try {
    const room = await ChatRoom.findOne({ roomId: req.body.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.groupProfilePic = req.file.path;
    await room.save();

    res.status(201).json({ path: req.file.path });
  } catch (error) {
    console.error("Error uploading group profile pic:", error);
  }
};

const deleteGroupProfilePic = async (req, res) => {
  try {
    const room = await ChatRoom.findOne({ roomId: req.body.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const filePath = room.groupProfilePic;
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Error deleting file:", error);
      } else {
        console.log("File deleted successfully.");
      }
    });

    room.groupProfilePic = "";
    await room.save();

    res.status(201).json({ path: "" });
  } catch (error) {
    console.error("Error deleting group profile pic:", error);
  }
};

const addNewGroupProfilePic = async (req, res) => {
  try {
    const room = await ChatRoom.findOne({ roomId: req.body.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const filePath = room.groupProfilePic;
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Error deleting file:", error);
      } else {
        console.log("File deleted successfully.");
      }
    });

    room.groupProfilePic = req.file.path;
    await room.save();

    res.status(201).json({ path: req.file.path });
  } catch (error) {
    console.error("Error adding new group profile pic:", error);
  }
};

module.exports = {
  uploadProfilePic,
  deleteProfilePic,
  addNewProfilePic,
  uploadGroupProfilePic,
  deleteGroupProfilePic,
  addNewGroupProfilePic,
};
