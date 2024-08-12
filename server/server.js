const express = require("express");
const connectDb = require("./configDb/MongoDb");
const authenticateJWT = require("./middlewares/authenticateJWT");
const {
  login,
  signup,
  editUserInfo,
  changePassword,
  deleteUsers,
} = require("./controllers/userController");
const {
  createRoom,
  joinRoom,
  getJoinedRoomsBasicDetails,
  getJoinedRoomsAdvancedDetails,
  uploadChat,
  leaveRoom,
  removeMember,
  makeAdmin,
  dissmisAsAdmin,
  deleteChats,
} = require("./controllers/chatRoomController");
const {
  uploadProfilePic,
  deleteProfilePic,
  addNewProfilePic,
  uploadGroupProfilePic,
  deleteGroupProfilePic,
  addNewGroupProfilePic,
} = require("./controllers/imageController");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));

connectDb();

const server = http.createServer(app);

// --------user controllers--------
// deleteUsers();
app.post("/api/users/login", login);
app.post("/api/users/signup", signup);
app.get("/api/user", authenticateJWT, (req, res) => {
  res.json({
    message: "Protected route accessed successfully!",
    user: req.user,
  });
});

// --------chatRoom controllers--------
// deleteChats();
app.post("/api/chat/createRoom", authenticateJWT, createRoom);
app.post("/api/chat/joinRoom", authenticateJWT, joinRoom);
app.post("/api/chat/uploadChat", authenticateJWT, uploadChat);
app.post("/api/chat/leaveRoom", authenticateJWT, leaveRoom);
app.post("/api/chat/removeMember", authenticateJWT, removeMember);
app.post("/api/chat/makeAdmin", authenticateJWT, makeAdmin);
app.post("/api/chat/dismissAsAdmin", authenticateJWT, dissmisAsAdmin);
app.get(
  "/api/user/getJoinedRoomsBasicDetails",
  authenticateJWT,
  getJoinedRoomsBasicDetails
);
app.get(
  "/api/chat/getJoinedRoomsAdvancedDetails",
  authenticateJWT,
  getJoinedRoomsAdvancedDetails
);

// --------image controllers--------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`
    );
  },
});
const upload = multer({ storage: storage });
app.post(
  "/api/uploadProfilePic",
  authenticateJWT,
  upload.single("profilePic"),
  uploadProfilePic
);
app.post("/api/deleteProfilePic", authenticateJWT, deleteProfilePic);
app.post(
  "/api/addNewProfilePic",
  authenticateJWT,
  upload.single("profilePic"),
  addNewProfilePic
);
app.post(
  "/api/uploadGroupProfilePic",
  authenticateJWT,
  upload.single("groupProfilePic"),
  uploadGroupProfilePic
);
app.post("/api/deleteGroupProfilePic", authenticateJWT, deleteGroupProfilePic);
app.post(
  "/api/addNewGroupProfilePic",
  authenticateJWT,
  upload.single("groupProfilePic"),
  addNewGroupProfilePic
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  const joinedRooms = new Set(); // Use a Set to avoid duplicate rooms

  // Handle create room
  socket.on("create_room", (roomId) => {
    socket.join(roomId);
    joinedRooms.add(roomId);
    console.log(`User created and joined a room: ${roomId}`);
  });

  // Handle new user joining room
  socket.on("join_room", (data) => {
    // Attach user data to the socket
    socket.user = data.user;

    // Check if the user is already in the room
    if (!joinedRooms.has(data.roomId)) {
      socket.join(data.roomId);
      joinedRooms.add(data.roomId);
      socket.broadcast.to(data.roomId).emit("join_room", {
        roomId: data.roomId,
        user: data.user,
        message: "has joined this room.",
      });
      console.dir(`${data.user.email} User joined a room: ${data.roomId}`);
    }
  });

  //handle send message
  socket.on("send_message", (data) => {
    console.log("emmiting message");
    io.to(data.roomId).emit("receive_message", { data: data });
  });

  // Handle leave room
  socket.on("leave_room", (data) => {
    if (joinedRooms.has(data.roomId)) {
      // Notify all users, including the one who is leaving
      io.to(data.roomId).emit("room_left", {
        roomId: data.roomId,
        user: data.user,
        message: `${data.user.name} has left the room.`,
      });

      // Leave the room
      socket.leave(data.roomId);
      joinedRooms.delete(data.roomId);
      console.log(`User left room: ${data.roomId}`);
    }
  });

  // Handle remove member
  socket.on("remove_member", (data) => {
    const { roomId, removedUser, removerUser } = data;

    // notifyying others even if the kicked user is not in the room (offline or something)
    io.to(roomId).emit("member_removed", {
      roomId,
      removedUser,
      removerUser,
    });

    // Find the socket of the user to be removed
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set();

    for (const socketId of socketsInRoom) {
      const clientSocket = io.sockets.sockets.get(socketId);
      // Check if the clientSocket has the user data
      if (clientSocket.user?.email === removedUser.email) {
        clientSocket.leave(roomId);

        // Disconnect the user from the socket
        clientSocket.disconnect(true);

        break;
      }
    }

    console.log("user removed", removedUser.email);
  });

  //Handle make admin
  socket.on("make_admin", (data) => {
    const { roomId, userToMakeAdmin } = data;

    io.to(roomId).emit("member_made_admin", {
      roomId,
      userToMakeAdmin,
    });
  });

  //Handle dismiss as admin
  socket.on("dismiss_as_admin", (data) => {
    const { roomId, userToDismissAsAdmin } = data;

    io.to(roomId).emit("member_dismissed_as_admin", {
      roomId,
      userToDismissAsAdmin,
    });
  });

  //handle room pic upload
  socket.on("room_pic_uploading", (data) => {
    const { roomId } = data;

    console.log("room pic uploading", data);

    io.to(roomId).emit("room_pic_uploaded", {
      data: data,
    });
  });

  //handle notification
  socket.on("send_notification", (data) => {
    // broadcast to all users in the room except the sender
    socket.broadcast.to(data.roomId).emit("receive_notification", {
      data: data,
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
