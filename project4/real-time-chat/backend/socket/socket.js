const Message = require("../models/Message");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room ${roomId}`);
    });

    socket.on("sendMessage", async (data) => {
      const message = await Message.create(data);

      // emit ONLY to that room
      io.to(data.roomId).emit("newMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
