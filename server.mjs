import { createServer } from "node:https";
import next from "next";
import { Server } from "socket.io";
import path from "node:path";
import fs from "node:fs";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const options = {
  key: fs.readFileSync(path.join("/home/hoshito/https-key", "key.pem")),
  cert: fs.readFileSync(path.join("/home/hoshito/https-key", "cert.pem")),
};

app.prepare().then(() => {
  const httpsServer = createServer(options, handler);
  const io = new Server(httpsServer);

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    io.sockets.emit("count", socket.client.conn.server.clientsCount);
    console.log("コネクション数", socket.client.conn.server.clientsCount);

    socket.onAny((event, data) => {
      console.log(`Received ${event} from ${socket.id}:`);
      socket.broadcast.emit(event, data);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpsServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
    });
});
