const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
{
    senderEmail: 
    {
        type: String,
        required: true,
    },
    message: 
    {
        type: String,
        required: true,
    },
    timestamp: 
    {
        type: Date,
        default: Date.now,
    },
});


const chatRoomSchema = new mongoose.Schema(
{
    roomId: 
    {
        type: String,
        required: true,
    },
    chats: [chatSchema],
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;

