const ChatRoom = require('../models/chatRoom');
const {User}=require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { SECRET_KEY } = process.env;



const createRoom = async (req, res) => 
{
    try 
    {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user) 
        {
            return res.status(404).json({ message: "User not found" });
        }
        const newRoom = new ChatRoom(
        {
            roomId: req.body.roomId,
            creator: user.email,
            roomName: req.body.roomName,
            roomMembers: [{ userEmail: user.email, armoredPublicKey : user.armoredPublicKey , joinTimestamp: Date.now() }],
        });
        await newRoom.save();
        res.status(201).json({ message: "Room created successfully" });
    } 
    catch (error) 
    {
        console.error("Error creating room:", error);
        if (error.name === "JsonWebTokenError") 
        {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "ValidationError") 
        {
            return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};


const joinRoom = async (req, res) => 
{
    try 
    {
        const room = await ChatRoom.findOne({ roomId: req.body.roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);

        if (!user) 
        {
            return res.status(404).json({ message: "User not found" });
        }

        const isMember = room.roomMembers.some((member) => member.userEmail === user.email);
        if (!isMember) 
        {
            room.roomMembers.push({ userEmail: user.email, armoredPublicKey : user.armoredPublicKey , joinTimestamp: Date.now() });
            await room.save();
        }

        res.status(201).json({ message: "Room joined successfully" });
    } 
    catch (error) 
    {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


const getJoinedRoomsBasicDetails = async (req, res) =>
{
    try
    {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);
        const email = user.email;
        const rooms = await ChatRoom.find({ "roomMembers.userEmail": email });
        if (!rooms)
        {
            return res.status(404).json({ message: "No joined rooms found" });
        }
        const simplifiedRooms = rooms.map((room) =>
        ({
            roomId : room.roomId,
            roomName : room.roomName,
            groupProfilePic : room.groupProfilePic
        }));
        res.status(200).json({ rooms: simplifiedRooms });
    }
    catch (error)
    {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getJoinedRoomsAdvancedDetails = async (req, res) =>
{
    const roomId = req.query.roomId;
    console.log(roomId);
    try 
    {
        const room = await ChatRoom.findOne({ roomId: roomId });
        console.log(room);
        if (!room) {
            return res.status(404).json({ message: "No joined rooms found" });
        }
        const simplifiedRoom = {
            chats: room.chats,
            creator: room.creator,
            roomMembers: room.roomMembers,
            timestamp: room.timestamp,
        };
        res.status(200).json({ rooms: simplifiedRoom });
    } 
    catch (error) 
    {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}



const uploadChat = async (req, res) => 
{
    try 
    {
        const { roomId, message, senderEmail, timeStamp } = req.body;

        const room = await ChatRoom.findOne({ roomId });
        if (!room) 
        {
            return res.status(404).json({ message: "Chat room not found" });
        }

        room.chats.push(
        {
            senderEmail,
            message,
            timestamp: timeStamp || new Date(),
        });
        await room.save();

        res.status(201).json({ message: "Chat uploaded successfully" });
    } 
    catch (error) 
    {
        console.error("Error uploading chat:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getChat = async (req, res) =>
{
    const { roomId } = req.body;
    try
    {
        const room = await ChatRoom.findOne({ roomId });
        if (!room)
        {
            return res.status(404).json({ message: "Chat room not found" });
        }
        res.status(200).json({ chats: room.chats });

    }
    catch (error)
    {
        console.log(error);
    }
}

const deleteChats = async (req, res) =>
{
    try
    {
        await ChatRoom.deleteMany({});
        console.log("All chats deleted");
    }
    catch (error)
    {
        console.log(error);
    }
}



module.exports = { 
    createRoom,
    joinRoom,
    getJoinedRoomsBasicDetails,
    getJoinedRoomsAdvancedDetails,
    uploadChat,
    getChat,
    deleteChats
};