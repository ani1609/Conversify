const ChatRoom = require('../models/chatRoom');


const uploadChat = async (req, res) =>
{
    console.log(req.body);
    const { roomId, message, senderName, senderEmail, timeStamp } = req.body;
    try
    {
        const room = await ChatRoom.findOne({ roomId });
        if (!room)
        {
            const newRoom = await new ChatRoom({ roomId }).save();
            newRoom.chats.push({ message, senderName, senderEmail, timeStamp });
            await newRoom.save();
            return res.status(201).send({ message: "New chatroom created and chat uploaded successfully" });
        }
        room.chats.push({ message, senderName, senderEmail, timeStamp });
        await room.save();
        return res.status(201).send({ message: "Chat uploaded successfully" });
    }
    catch (error)
    {
        console.error(error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
}

const getChat = async (req, res) =>
{
    console.log(req.body);
    console.log("got get chat request");
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
    uploadChat,
    getChat,
    deleteChats
};