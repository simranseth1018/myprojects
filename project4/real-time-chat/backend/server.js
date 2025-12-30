require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

require("./socket/socket")(io);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(5000, () =>
    console.log("Backend running on port 5000")
  );
});
