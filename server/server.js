const express=require("express");
const app=express();
const http=require('http');
const{ Server }=require('socket.io');
const cors=require('cors');
const port=3000;

app.use(cors());

const server=http.createServer(app);

const io=new  Server(server,{
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

server.listen(port, () =>
{
    console.log(`server is listening on port ${port}`);
});