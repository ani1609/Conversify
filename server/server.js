const express=require("express");
const connectDb = require('./configDB/MongoDB');
const {login, signup, authenticateJWT, changePassword}=require('./controllers/userController');
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
app.post('/api/users/login', login);
app.post('/api/users/signup', signup);
app.get('/api/user', authenticateJWT, (req, res) => 
{
    res.json({ message: 'Protected route accessed successfully!', user: req.user });
});


// const io=new  Server(server,{
//     cors: {
//         origin: "http://localhost:3001",
//         methods: ["GET", "POST"],
//     },
// });

// io.on('connection', (socket) => 
// {
//     console.log('A user connected');

//     // Handle create room
//     socket.on('create_room', (roomId) => 
//     {
//         socket.join(roomId);
//         console.log(`User created and joined a room: ${roomId}`);
//     });

//     // Handle joining room
//     socket.on('join_room', (roomId) => 
//     {
//         socket.join(roomId);
//         console.log(`User joined a room: ${roomId}`);
//     });

//     //handle send message
//     socket.on('send_message', (data) => 
//     {
//         console.log("received message ", data);
//         io.to(data.roomId).emit('receive_message', { message: data.message });
//     });

//     socket.on('disconnect', () => 
//     {
//         console.log('A user disconnected');
//     });
// });

server.listen(port, () =>
{
    console.log(`server is listening on port ${port}`);
});

