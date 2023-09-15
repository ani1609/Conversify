const mongoose = require('mongoose');


const chatRoomSchema = new mongoose.Schema(
{
    roomId: 
    {
        type: String,
        required: true,
    },
    creator:
    {
        type: String,
        required: true,
    },
    roomName:
    {
        type: String,
        required: true,
    },
    roomMembers: 
    [
        {
            userEmail: {
                type: String,
                required: true,
            },
            joinTimestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    groupProfilePic:
    {
        type: String,
    },
    timestamp:
    {
        type: Date,
        default: Date.now,
    },
    chats: 
    [
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
        },
    ],
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;

