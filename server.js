import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import colors from "colors";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import cors from "cors";
import { Server } from "socket.io";
// import path from "path";

//config env
dotenv.config();

//connected to db
connectDb();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5080;

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// app.get("/", (req, res) => {
//   res.send("API is running!");
// });

const server = app.listen(
  PORT,
  console.log(`Server started on ${PORT}`.bgYellow)
);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://65198307374989580fe2967c--whimsical-hummingbird-b7ffea.netlify.app",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("Join chat", (room) => {
    socket.join(room);
    console.log("User room:" + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });
});
