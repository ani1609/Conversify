const mongoose = require('mongoose');


const chatRoomSchema = new mongoose.Schema(
{
    roomId: 
    {
        type: String,
        required: true,
    },
    creatorName:
    {
        type: String,
        required: true,
    },
    creatorEmail:
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
            userEmail: 
            {
                type: String,
                required: true,
            },
            armoredPublicKey:
            {
                type: String,
                required: true,
            },
            joinTimestamp: 
            {
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
            senderName:
            {
                type: String,
                required: true,
            },
            senderEmail: 
            {
                type: String,
                required: true,
            },
            senderProfilePic:
            {
                type: String,
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

