const ChatRoom = require("../models/chatRoom");
require("dotenv").config();
const openpgp = require("openpgp");

const createRoom = async (req, res) => {
  try {
    const user = req.user;

    const newRoom = new ChatRoom({
      roomId: req.body.roomId,
      creatorName: user.name,
      creatorEmail: user.email,
      roomName: req.body.roomName,
      roomMembers: [
        {
          userEmail: user.email,
          armoredPublicKey: user.armoredPublicKey,
          joinTimestamp: Date.now(),
        },
      ],
    });
    await newRoom.save();
    res.status(201).json({ message: "Room created successfully" });
  } catch (error) {
    console.error("Error creating room:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const joinRoom = async (req, res) => {
  try {
    const user = req.user;

    const room = await ChatRoom.findOne({ roomId: req.body.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isMember = room.roomMembers.some(
      (member) => member.userEmail === user.email
    );
    if (!isMember) {
      room.roomMembers.push({
        userEmail: user.email,
        armoredPublicKey: user.armoredPublicKey,
        joinTimestamp: Date.now(),
      });
      await room.save();
    }

    res.status(201).json({ message: "Room joined successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getJoinedRoomsBasicDetails = async (req, res) => {
  try {
    const user = req.user;
    const email = user.email;
    const rooms = await ChatRoom.find({ "roomMembers.userEmail": email });

    if (!rooms) {
      return res.status(404).json({ message: "No joined rooms found" });
    }

    const simplifiedRooms = await Promise.all(
      rooms.map(async (room) => {
        if (
          room.chats.length > 0 &&
          room.chats[room.chats.length - 1].message
        ) {
          const decryptedMessage = await decryptMessage(
            room.chats[room.chats.length - 1].message,
            user.encryptedPrivateKey
          );
          console.log("decryptedMessage: ", decryptedMessage);
          return {
            roomId: room.roomId,
            roomName: room.roomName,
            groupProfilePic: room.groupProfilePic,
            lastMessage: {
              senderEmail: room.chats[room.chats.length - 1].senderEmail,
              senderName: room.chats[room.chats.length - 1].senderName,
              message: decryptedMessage,
              timestamp: room.chats[room.chats.length - 1].timestamp,
            },
          };
        }
        return {
          roomId: room.roomId,
          roomName: room.roomName,
          groupProfilePic: room.groupProfilePic,
          lastMessage: null,
        };
      })
    );

    res.status(200).json({ rooms: simplifiedRooms });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

async function decryptMessage(encryptedMessage, privateKey) {
  try {
    const { data: decrypted } = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
      decryptionKeys: await openpgp.readPrivateKey({ armoredKey: privateKey }),
    });
    return decrypted;
  } catch (error) {
    console.error("Error in decrypting message: ", error);
    return undefined;
  }
}

const getJoinedRoomsAdvancedDetails = async (req, res) => {
  const roomId = req.query.roomId;
  try {
    const room = await ChatRoom.findOne({ roomId: roomId });
    if (!room) {
      return res.status(404).json({ message: "No joined rooms found" });
    }
    const simplifiedRoom = {
      chats: room.chats,
      creatorName: room.creatorName,
      creatorEmail: room.creatorEmail,
      roomMembers: room.roomMembers,
      timestamp: room.timestamp,
    };
    res.status(200).json({ rooms: simplifiedRoom });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadChat = async (req, res) => {
  try {
    const {
      roomId,
      message,
      senderName,
      senderEmail,
      senderProfilePic,
      timestamp,
    } = req.body;
    const room = await ChatRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    room.chats.push({
      senderName,
      senderEmail,
      senderProfilePic,
      message,
      timestamp: timestamp || new Date(),
    });
    await room.save();

    res.status(201).json({ message: "Chat uploaded successfully" });
  } catch (error) {
    console.error("Error uploading chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getChat = async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await ChatRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Chat room not found" });
    }
    res.status(200).json({ chats: room.chats });
  } catch (error) {
    console.log(error);
  }
};

const deleteChats = async (req, res) => {
  try {
    await ChatRoom.deleteMany({});
    console.log("All chats deleted");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getJoinedRoomsBasicDetails,
  getJoinedRoomsAdvancedDetails,
  uploadChat,
  getChat,
  deleteChats,
};
