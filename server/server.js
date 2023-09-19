const express=require("express");
const connectDb = require('./configDB/MongoDB');
const {login, signup, authenticateJWT, uploadRoomId, getRoomId, editUserInfo, changePassword, deleteUsers}=require('./controllers/userController');
const {createRoom, joinRoom, getRoomMembers, uploadChat, getChat, deleteChats}=require('./controllers/chatRoomController');
const http=require('http');
const{ Server }=require('socket.io');
const cors=require('cors');

const app=express();
const port=3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));

connectDb();


const server=http.createServer(app);


// --------user controllers--------
// deleteUsers();
app.post('/api/users/login', login);
app.post('/api/users/signup', signup);
app.get('/api/user', authenticateJWT, (req, res) => 
{
    res.json({ message: 'Protected route accessed successfully!', user: req.user });
});

// --------chatRoom controllers--------
// deleteChats();
app.post('/api/chat/upload', uploadChat);
app.post('/api/chat/getChat', getChat);
app.post('/api/chat/createRoom', createRoom);
app.post('/api/chat/joinRoom', joinRoom);
app.post('/api/chat/getRoomMembers', getRoomMembers);



const io=new  Server(server,{
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

io.on('connection', (socket) => 
{
    console.log('A user connected');

    // Handle create room
    socket.on('create_room', (roomId) => 
    {
        socket.join(roomId);
        console.log(`User created and joined a room: ${roomId}`);
    });

    // Handle new user joining room
    socket.on('join_room', (data) => 
    {
        socket.join(data.roomId);
        socket.broadcast.to(data.roomId).emit('join_room', { user: data.user, message: 'has joined this room.' });
        console.log(`User joined a room: ${data.roomId}`);
    });

    //handle send message
    socket.on('send_message', (data) => 
    {
        console.log("received message is", data);
        io.to(data.roomId).emit('receive_message', { data: data});
    });

    socket.on('disconnect', () => 
    {
        console.log('A user disconnected');
    });
});

server.listen(port, () =>
{
    console.log(`server is listening on port ${port}`);
});

