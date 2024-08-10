const ChatRoom = require("../models/chatRoom");
require("dotenv").config();
const openpgp = require("openpgp");

const createRoom = async (req, res) => {
  try {
    const user = req.user;

    const newRoom = new ChatRoom({
      roomId: req.body.roomId,
      roomName: req.body.roomName,
      groupProfilePic: "",
      timestamp: Date.now(),
      creator: user._id,
      roomMembers: [
        {
          member: user._id,
          isAdmin: true,
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

    const isMember = room.roomMembers.some((member) =>
      member.member.equals(user._id)
    );

    //check if the user is in the previous members list

    const isPastMember = room.pastRoomMembers.some((member) =>
      member.member.equals(user._id)
    );

    if (isPastMember) {
      //remove the user from the past members list and add to the current members list
      room.pastRoomMembers = room.pastRoomMembers.filter(
        (member) => !member.member.equals(user._id)
      );
    }

    if (!isMember) {
      room.roomMembers.push({
        member: user._id,
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

    const rooms = await ChatRoom.find({
      $or: [
        { "roomMembers.member": user._id },
        { "pastRoomMembers.member": user._id },
      ],
    })
      .populate("chats.sender", "name")
      .populate("pastRoomMembers.removedBy", "name");

    if (!rooms.length) {
      return res.status(404).json({ message: "No joined rooms found" });
    }

    const simplifiedRooms = await Promise.all(
      rooms.map(async (room) => {
        const lastChat =
          room.chats.length > 0 ? room.chats[room.chats.length - 1] : null;

        let decryptedMessage = null;
        if (lastChat && lastChat.message) {
          decryptedMessage = await decryptMessage(
            lastChat.message,
            user.encryptedPrivateKey
          );
        }

        const isLeft = room.pastRoomMembers.some(
          (memberObj) =>
            memberObj.member.equals(user._id) && !memberObj.removedBy
        );

        const removedMember = room.pastRoomMembers.find(
          (memberObj) =>
            memberObj.member.equals(user._id) && memberObj.removedBy
        );

        const isRemoved = !!removedMember;

        return {
          roomId: room.roomId,
          roomName: room.roomName,
          groupProfilePic: room.groupProfilePic,
          lastMessage: lastChat
            ? {
                senderName: lastChat.sender.name,
                message: decryptedMessage,
                timestamp: lastChat.timestamp,
              }
            : null,
          isRoomLeft: isLeft,
          isRemovedFromRoom: isRemoved,
          removerName: isRemoved ? removedMember.removedBy.name : null,
        };
      })
    );

    res.status(200).json({ rooms: simplifiedRooms });
  } catch (error) {
    console.error("Error fetching joined rooms:", error);
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
  const user = req.user;

  try {
    const room = await ChatRoom.findOne({ roomId: roomId })
      .populate("creator", "name email profilePic")
      .populate("roomMembers.member", "name email profilePic armoredPublicKey")
      .populate("chats.sender", "name email profilePic")
      .populate("pastRoomMembers.removedBy", "name");
    if (!room) {
      return res.status(404).json({ message: "No joined rooms found" });
    }

    const isLeft = room.pastRoomMembers.some(
      (memberObj) => memberObj.member.equals(user._id) && !memberObj.removedBy
    );

    const removedMember = room.pastRoomMembers.find(
      (memberObj) => memberObj.member.equals(user._id) && memberObj.removedBy
    );

    const isRemoved = !!removedMember;

    const advancedRoom = {
      chats: room.chats.map((chat) => ({
        senderName: chat.sender.name,
        senderEmail: chat.sender.email,
        senderProfilePic: chat.sender.profilePic,
        message: chat.message,
        timestamp: chat.timestamp,
      })),
      creator: {
        name: room.creator.name,
        email: room.creator.email,
        profilePic: room.creator.profilePic,
      },
      roomMembers: room.roomMembers.map((member) => ({
        name: member.member.name,
        email: member.member.email,
        profilePic: member.member.profilePic,
        armoredPublicKey: member.member.armoredPublicKey,
        joinTimestamp: member.joinTimestamp,
        isAdmin: member.isAdmin,
      })),
      timestamp: room.timestamp,
      roomId: room.roomId,
      roomName: room.roomName,
      groupProfilePic: room.groupProfilePic,
      isRoomLeft: isLeft,
      isRemovedFromRoom: isRemoved,
      removerName: isRemoved ? removedMember.removedBy.name : null,
    };

    res.status(200).json({ room: advancedRoom });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadChat = async (req, res) => {
  try {
    const user = req.user;
    const { roomId, message, timestamp } = req.body;

    const room = await ChatRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    room.chats.push({
      sender: user._id,
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

const leaveRoom = async (req, res) => {
  const { roomId } = req.body;
  const user = req.user;

  try {
    const room = await ChatRoom.findOne({
      roomId,
      "roomMembers.member": user._id,
    });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.pastRoomMembers.push({
      member: user._id,
      leftTimestamp: Date.now(),
    });

    room.roomMembers = room.roomMembers.filter(
      (member) => member.member.toString() !== user._id.toString()
    );

    await room.save();

    res.status(200).json({ message: "Left room successfully" });
  } catch (error) {
    console.log(error);
  }
};

const removeMember = async (req, res) => {
  const { roomId, userToRemove } = req.body;
  const user = req.user;

  try {
    const room = await ChatRoom.findOne({ roomId }).populate(
      "roomMembers.member"
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const memberToRemove = room.roomMembers.find(
      (member) => member.member.email === userToRemove.email
    );

    if (!memberToRemove) {
      return res.status(404).json({ message: "Member not found in the room" });
    }

    room.roomMembers = room.roomMembers.filter(
      (member) => member.member.email !== userToRemove.email
    );

    room.pastRoomMembers.push({
      member: memberToRemove.member._id,
      leftTimestamp: new Date(),
      removedBy: user._id,
    });

    await room.save();

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const makeAdmin = async (req, res) => {
  const { roomId, userToMakeAdmin } = req.body;

  try {
    const room = await ChatRoom.findOne({ roomId }).populate(
      "roomMembers.member",
      "email"
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const memberToMakeAdmin = room.roomMembers.find(
      (member) => member.member.email === userToMakeAdmin.email
    );

    if (!memberToMakeAdmin) {
      return res.status(404).json({ message: "Member not found in the room" });
    }

    memberToMakeAdmin.isAdmin = true;

    await room.save();

    res.status(200).json({ message: "Member made admin successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const dissmisAsAdmin = async (req, res) => {
  const { roomId, userToDismissAsAdmin } = req.body;

  try {
    const room = await ChatRoom.findOne({ roomId }).populate(
      "roomMembers.member",
      "email"
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const memberToMakeAdmin = room.roomMembers.find(
      (member) => member.member.email === userToDismissAsAdmin.email
    );

    if (!memberToMakeAdmin) {
      return res.status(404).json({ message: "Member not found in the room" });
    }

    memberToMakeAdmin.isAdmin = false;

    await room.save();

    res.status(200).json({ message: "Member made admin successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
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
  leaveRoom,
  removeMember,
  makeAdmin,
  dissmisAsAdmin,
  deleteChats,
};
